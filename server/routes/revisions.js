const express = require('express');
const router = express.Router();
const { format, addDays } = require('date-fns');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { calculateDaysLate, isDateOverdue, toDateString } = require('../scheduler');

router.use(authMiddleware);

// Get Today's Revisions
router.get('/today', (req, res) => {
  try {
    const todayStr = req.query.date ? toDateString(req.query.date) : format(new Date(), 'yyyy-MM-dd');

    const revisions = db.prepare(`
      SELECT 
        r.*, 
        u.name as unit_name, 
        u.unit_number, 
        u.difficulty, 
        u.estimated_minutes,
        s.id as subject_id,
        s.name as subject_name, 
        s.color as subject_color,
        ss.study_date as original_study_date
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.user_id = ? 
        AND r.scheduled_date = ?
        AND r.status != 'Completed'
      ORDER BY r.revision_number ASC
    `).all(req.user.id, todayStr);

    res.json(revisions);
  } catch (err) {
    console.error('Fetch today revisions error:', err);
    res.status(500).json({ error: 'Failed to retrieve today revisions' });
  }
});

// Get Overdue Revisions
router.get('/overdue', (req, res) => {
  try {
    const todayStr = req.query.date ? toDateString(req.query.date) : format(new Date(), 'yyyy-MM-dd');

    const overdueList = db.prepare(`
      SELECT 
        r.*, 
        u.name as unit_name, 
        u.unit_number, 
        u.difficulty, 
        u.estimated_minutes,
        s.id as subject_id,
        s.name as subject_name, 
        s.color as subject_color,
        ss.study_date as original_study_date
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.user_id = ? 
        AND r.scheduled_date < ?
        AND r.status != 'Completed'
      ORDER BY r.scheduled_date ASC
    `).all(req.user.id, todayStr);

    // Calculate current days late for display
    const enriched = overdueList.map(r => ({
      ...r,
      current_days_late: calculateDaysLate(r.scheduled_date, todayStr)
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Fetch overdue revisions error:', err);
    res.status(500).json({ error: 'Failed to retrieve overdue revisions' });
  }
});

// Get Upcoming Revisions (next 7-14 days)
router.get('/upcoming', (req, res) => {
  try {
    const todayStr = req.query.date ? toDateString(req.query.date) : format(new Date(), 'yyyy-MM-dd');
    const daysAhead = Number(req.query.days) || 14;
    
    const [year, month, day] = todayStr.split('-').map(Number);
    const todayDateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const maxDateStr = format(addDays(todayDateObj, daysAhead), 'yyyy-MM-dd');

    const upcoming = db.prepare(`
      SELECT 
        r.*, 
        u.name as unit_name, 
        u.unit_number, 
        u.difficulty, 
        u.estimated_minutes,
        s.id as subject_id,
        s.name as subject_name, 
        s.color as subject_color,
        ss.study_date as original_study_date
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.user_id = ? 
        AND r.scheduled_date > ? 
        AND r.scheduled_date <= ?
        AND r.status != 'Completed'
      ORDER BY r.scheduled_date ASC
    `).all(req.user.id, todayStr, maxDateStr);

    res.json(upcoming);
  } catch (err) {
    console.error('Fetch upcoming revisions error:', err);
    res.status(500).json({ error: 'Failed to retrieve upcoming revisions' });
  }
});

// Get Revision Session Details
router.get('/:id', (req, res) => {
  try {
    const revision = db.prepare(`
      SELECT 
        r.*, 
        u.name as unit_name, 
        u.unit_number, 
        u.description as unit_description,
        u.difficulty, 
        u.estimated_minutes,
        s.id as subject_id,
        s.name as subject_name, 
        s.color as subject_color,
        ss.study_date as original_study_date,
        ss.duration_minutes as original_study_duration
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!revision) {
      return res.status(404).json({ error: 'Revision session not found' });
    }

    const notes = db.prepare('SELECT * FROM notes WHERE unit_id = ?').get(revision.unit_id);

    res.json({
      ...revision,
      notes: notes || null
    });
  } catch (err) {
    console.error('Get revision details error:', err);
    res.status(500).json({ error: 'Failed to fetch revision details' });
  }
});

// Complete Revision Session
router.post('/:id/complete', (req, res) => {
  try {
    const { id } = req.params;
    const {
      performance = 'Good', // 'Difficult', 'Average', 'Good', 'Excellent'
      durationMinutes = 20,
      completionDate,
      feedbackNotes = ''
    } = req.body;

    const revision = db.prepare(`
      SELECT r.*, u.id as unit_id, u.name as unit_name, u.unit_number, s.name as subject_name 
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(id, req.user.id);

    if (!revision) {
      return res.status(404).json({ error: 'Revision session not found' });
    }

    const effectiveCompDate = completionDate ? toDateString(completionDate) : format(new Date(), 'yyyy-MM-dd');
    const nowIso = new Date().toISOString();
    const daysLate = calculateDaysLate(revision.scheduled_date, effectiveCompDate);
    const validPerf = ['Difficult', 'Average', 'Good', 'Excellent'].includes(performance) ? performance : 'Good';
    const duration = Math.max(1, Number(durationMinutes) || 15);

    const transaction = db.transaction(() => {
      // 1. Mark this revision completed
      db.prepare(`
        UPDATE revision_sessions
        SET status = 'Completed',
            completed_at = ?,
            duration_minutes = ?,
            performance = ?,
            days_late = ?,
            feedback_notes = ?
        WHERE id = ?
      `).run(nowIso, duration, validPerf, daysLate, feedbackNotes, id);

      // 2. Mark any related notification as read/sent
      db.prepare(`
        UPDATE notifications 
        SET is_read = 1, status = 'Delivered', sent_at = ?
        WHERE revision_session_id = ?
      `).run(nowIso, id);

      // 3. Check unit's overall 1-4-7 completion status
      const allRevisions = db.prepare(`
        SELECT revision_number, status 
        FROM revision_sessions 
        WHERE unit_id = ?
      `).all(revision.unit_id);

      const rev1 = allRevisions.find(r => r.revision_number === 1);
      const rev2 = allRevisions.find(r => r.revision_number === 2);

      let nextUnitStatus = 'Revision Scheduled';
      let isMastered = false;

      if (rev1?.status === 'Completed' && rev2?.status === 'Completed') {
        nextUnitStatus = 'Mastered';
        isMastered = true;
      } else if (rev1?.status === 'Completed') {
        nextUnitStatus = 'Revision 1 Completed';
      }

      db.prepare('UPDATE units SET status = ? WHERE id = ?').run(nextUnitStatus, revision.unit_id);

      // 4. Update streak
      const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(req.user.id);
      if (streak) {
        if (streak.last_activity_date !== effectiveCompDate) {
          const nextCurrent = (streak.last_activity_date && calculateDaysLate(streak.last_activity_date, effectiveCompDate) === 1) 
            ? streak.current_streak + 1 
            : 1;
          const nextLongest = Math.max(nextCurrent, streak.longest_streak || 0);
          db.prepare('UPDATE streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?')
            .run(nextCurrent, nextLongest, effectiveCompDate, req.user.id);
        }
      }

      return {
        unitStatus: nextUnitStatus,
        isMastered,
        daysLate
      };
    });

    const result = transaction();

    res.json({
      success: true,
      message: result.isMastered
        ? '🏆 Congratulations! All 1-4-7 revisions completed. Unit is now MASTERED!'
        : `Revision #${revision.revision_number} marked completed!`,
      revisionId: id,
      revisionNumber: revision.revision_number,
      unitId: revision.unit_id,
      unitStatus: result.unitStatus,
      isMastered: result.isMastered,
      daysLate: result.daysLate,
      performance: validPerf
    });
  } catch (err) {
    console.error('Complete revision error:', err);
    res.status(500).json({ error: 'Failed to record revision completion: ' + err.message });
  }
});

module.exports = router;
