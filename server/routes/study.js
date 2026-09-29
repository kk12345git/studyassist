const express = require('express');
const router = express.Router();
const { format, subDays } = require('date-fns');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { calculate147Schedule, toDateString } = require('../scheduler');

router.use(authMiddleware);

// Helper to update streak
function recordUserActivity(userId, activityDateStr) {
  const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
  if (!streak) {
    db.prepare(`
      INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_activity_date)
      VALUES (?, ?, 1, 1, ?)
    `).run('strk_' + userId, userId, activityDateStr);
    return;
  }

  if (streak.last_activity_date === activityDateStr) {
    // Already recorded activity for this date
    return;
  }

  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  let nextCurrent = 1;
  if (streak.last_activity_date === yesterdayStr) {
    nextCurrent = streak.current_streak + 1;
  } else if (!streak.last_activity_date) {
    nextCurrent = 1;
  }

  const nextLongest = Math.max(nextCurrent, streak.longest_streak || 0);

  db.prepare(`
    UPDATE streaks 
    SET current_streak = ?, longest_streak = ?, last_activity_date = ?
    WHERE user_id = ?
  `).run(nextCurrent, nextLongest, activityDateStr, userId);
}

// Start Day 1 Study Session
router.post('/start', (req, res) => {
  try {
    const { unitId } = req.body;
    if (!unitId) {
      return res.status(400).json({ error: 'unitId is required' });
    }

    const unit = db.prepare('SELECT * FROM units WHERE id = ? AND user_id = ?').get(unitId, req.user.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Set unit status to Studying
    db.prepare("UPDATE units SET status = 'Studying' WHERE id = ?").run(unitId);

    const nowIso = new Date().toISOString();
    res.json({
      unitId,
      startedAt: nowIso,
      estimatedMinutes: unit.estimated_minutes,
      status: 'Studying'
    });
  } catch (err) {
    console.error('Start study error:', err);
    res.status(500).json({ error: 'Failed to start study session' });
  }
});

// Complete Day 1 Study Session and Auto-Generate 1-4-7 Revision Schedule
router.post('/complete', (req, res) => {
  try {
    const {
      unitId,
      subjectId,
      studyDate, // e.g. '2026-09-29'
      durationMinutes = 60,
      startedAt,
      completedAt,
      notes = '',
      checklist = []
    } = req.body;

    if (!unitId || !subjectId) {
      return res.status(400).json({ error: 'unitId and subjectId are required' });
    }

    const unit = db.prepare(`
      SELECT u.*, s.name as subject_name 
      FROM units u 
      JOIN subjects s ON u.subject_id = s.id 
      WHERE u.id = ? AND u.user_id = ?
    `).get(unitId, req.user.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const effectiveStudyDate = studyDate ? toDateString(studyDate) : format(new Date(), 'yyyy-MM-dd');
    const effectiveStartedAt = startedAt || new Date().toISOString();
    const effectiveCompletedAt = completedAt || new Date().toISOString();
    const duration = Math.max(1, Number(durationMinutes) || 1);

    // 1. Calculate 1-4-7 Schedule
    // Day 1 = Study Date
    // Day 4 = Study Date + 3 days (First Revision)
    // Day 7 = Study Date + 6 days (Second Revision)
    const schedule = calculate147Schedule(effectiveStudyDate);

    // 2. Begin database transaction
    const runTransaction = db.transaction(() => {
      // Create Study Session
      const studySessionId = 'study_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      db.prepare(`
        INSERT INTO study_sessions (
          id, user_id, subject_id, unit_id, started_at, completed_at, 
          study_date, duration_minutes, status, notes, checklist, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?, ?)
      `).run(
        studySessionId,
        req.user.id,
        subjectId,
        unitId,
        effectiveStartedAt,
        effectiveCompletedAt,
        effectiveStudyDate,
        duration,
        typeof notes === 'string' ? notes : JSON.stringify(notes),
        JSON.stringify(checklist || []),
        effectiveCompletedAt
      );

      // Clean up any old pending revisions for this unit if re-studying
      db.prepare("DELETE FROM revision_sessions WHERE unit_id = ? AND status != 'Completed'").run(unitId);

      // Create Day 4 Revision (Study Date + 3 days)
      const rev1Id = 'rev_' + Date.now() + '_1';
      db.prepare(`
        INSERT INTO revision_sessions (
          id, user_id, subject_id, unit_id, study_session_id, revision_number, 
          stage_title, scheduled_date, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, 1, 'Revise #1', ?, 'Pending', ?)
      `).run(rev1Id, req.user.id, subjectId, unitId, studySessionId, schedule.day4.date, effectiveCompletedAt);

      // Create Day 7 Revision (Study Date + 6 days)
      const rev2Id = 'rev_' + Date.now() + '_2';
      db.prepare(`
        INSERT INTO revision_sessions (
          id, user_id, subject_id, unit_id, study_session_id, revision_number, 
          stage_title, scheduled_date, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, 2, 'Revise #2', ?, 'Pending', ?)
      `).run(rev2Id, req.user.id, subjectId, unitId, studySessionId, schedule.day7.date, effectiveCompletedAt);

      // Create Reminder Notifications
      const settings = db.prepare('SELECT reminder_time FROM user_settings WHERE user_id = ?').get(req.user.id);
      const reminderTime = settings?.reminder_time || '19:00';

      // Day 4 notification
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, revision_session_id, notification_type, title, 
          message, scheduled_date, scheduled_time, is_read, created_at
        )
        VALUES (?, ?, ?, 'day_4_reminder', ?, ?, ?, ?, 0, ?)
      `).run(
        'notif_' + rev1Id,
        req.user.id,
        rev1Id,
        '📚 Revision Reminder (Day 4)',
        `Today is Day 4! It's time to revise: ${unit.subject_name} - ${unit.unit_number}: ${unit.name}. Your first revision is scheduled today.`,
        schedule.day4.date,
        reminderTime,
        effectiveCompletedAt
      );

      // Day 7 notification
      db.prepare(`
        INSERT INTO notifications (
          id, user_id, revision_session_id, notification_type, title, 
          message, scheduled_date, scheduled_time, is_read, created_at
        )
        VALUES (?, ?, ?, 'day_7_reminder', ?, ?, ?, ?, 0, ?)
      `).run(
        'notif_' + rev2Id,
        req.user.id,
        rev2Id,
        '🧠 Final 1-4-7 Revision (Day 7)',
        `Today is Day 7! Revise: ${unit.subject_name} - ${unit.unit_number}: ${unit.name}. Complete your second revision to lock it into long-term memory!`,
        schedule.day7.date,
        reminderTime,
        effectiveCompletedAt
      );

      // Update unit status to 'Revision Scheduled'
      db.prepare("UPDATE units SET status = 'Revision Scheduled' WHERE id = ?").run(unitId);

      // Update unit notes if content supplied
      if (notes && typeof notes === 'string' && notes.trim()) {
        const existingNote = db.prepare('SELECT id FROM notes WHERE unit_id = ?').get(unitId);
        if (existingNote) {
          db.prepare('UPDATE notes SET content = ?, updated_at = ? WHERE unit_id = ?').run(notes, effectiveCompletedAt, unitId);
        } else {
          db.prepare(`
            INSERT INTO notes (id, user_id, unit_id, content, important_points, key_terms, questions_2m, questions_5m, questions_10m, updated_at)
            VALUES (?, ?, ?, ?, '[]', '[]', '[]', '[]', '[]', ?)
          `).run('note_' + unitId, req.user.id, unitId, notes, effectiveCompletedAt);
        }
      }

      // Record streak
      recordUserActivity(req.user.id, effectiveStudyDate);

      return {
        studySessionId,
        schedule,
        revisions: [
          {
            id: rev1Id,
            revision_number: 1,
            stage_title: 'Revise #1',
            scheduled_date: schedule.day4.date,
            status: 'Pending'
          },
          {
            id: rev2Id,
            revision_number: 2,
            stage_title: 'Revise #2',
            scheduled_date: schedule.day7.date,
            status: 'Pending'
          }
        ]
      };
    });

    const result = runTransaction();

    res.status(201).json({
      success: true,
      message: 'Day 1 Study completed! 1-4-7 Revision Schedule generated automatically.',
      unitId,
      unitStatus: 'Revision Scheduled',
      studySessionId: result.studySessionId,
      schedule: result.schedule,
      revisions: result.revisions
    });
  } catch (err) {
    console.error('Complete study session error:', err);
    res.status(500).json({ error: 'Failed to complete study session: ' + err.message });
  }
});

module.exports = router;
