const express = require('express');
const router = express.Router();
const { format, addDays } = require('date-fns');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { toDateString, calculateDaysLate } = require('../scheduler');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const todayStr = req.query.date ? toDateString(req.query.date) : format(new Date(), 'yyyy-MM-dd');
    const userId = req.user.id;

    // 1. Overall counts
    const totalSubjects = db.prepare('SELECT count(*) as count FROM subjects WHERE user_id = ? AND is_archived = 0').get(userId).count;
    const totalUnits = db.prepare('SELECT count(*) as count FROM units WHERE user_id = ?').get(userId).count;
    const unitsStudied = db.prepare("SELECT count(*) as count FROM units WHERE user_id = ? AND status != 'Not Started'").get(userId).count;
    const masteredUnits = db.prepare("SELECT count(*) as count FROM units WHERE user_id = ? AND status = 'Mastered'").get(userId).count;

    const totalRevisions = db.prepare('SELECT count(*) as count FROM revision_sessions WHERE user_id = ?').get(userId).count;
    const completedRevisions = db.prepare("SELECT count(*) as count FROM revision_sessions WHERE user_id = ? AND status = 'Completed'").get(userId).count;
    const onTimeRevisions = db.prepare("SELECT count(*) as count FROM revision_sessions WHERE user_id = ? AND status = 'Completed' AND days_late = 0").get(userId).count;

    // Pending and overdue revisions
    const pendingRevisions = db.prepare("SELECT count(*) as count FROM revision_sessions WHERE user_id = ? AND status != 'Completed'").get(userId).count;
    const overdueRevisionsCount = db.prepare("SELECT count(*) as count FROM revision_sessions WHERE user_id = ? AND scheduled_date < ? AND status != 'Completed'").get(userId, todayStr).count;

    // Study minutes total
    const studyMins1 = db.prepare('SELECT sum(duration_minutes) as total FROM study_sessions WHERE user_id = ?').get(userId).total || 0;
    const studyMins2 = db.prepare("SELECT sum(duration_minutes) as total FROM revision_sessions WHERE user_id = ? AND status = 'Completed'").get(userId).total || 0;
    const totalStudyMinutes = studyMins1 + studyMins2;

    // Rates
    const revisionCompletionRate = totalRevisions > 0 ? Math.round((completedRevisions / totalRevisions) * 100) : 100;
    const onTimePercentage = completedRevisions > 0 ? Math.round((onTimeRevisions / completedRevisions) * 100) : 100;

    // Calculate overall progress across all units:
    // Units not started: 0%, revision scheduled: 33%, revision 1 completed: 66%, mastered: 100%
    const allUnits = db.prepare('SELECT status FROM units WHERE user_id = ?').all(userId);
    let totalScore = 0;
    allUnits.forEach(u => {
      if (u.status === 'Mastered') totalScore += 100;
      else if (u.status === 'Revision 1 Completed') totalScore += 66;
      else if (u.status === 'Revision Scheduled') totalScore += 33;
      else if (u.status === 'Studying') totalScore += 15;
    });
    const overallStudyProgress = totalUnits > 0 ? Math.round(totalScore / totalUnits) : 0;

    // 2. Today's Tasks
    // Today's Day 4 revisions
    const todayDay4Revisions = db.prepare(`
      SELECT r.*, u.name as unit_name, u.unit_number, u.estimated_minutes, s.name as subject_name, s.color as subject_color
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.user_id = ? AND r.scheduled_date = ? AND r.revision_number = 1 AND r.status != 'Completed'
    `).all(userId, todayStr);

    // Today's Day 7 revisions
    const todayDay7Revisions = db.prepare(`
      SELECT r.*, u.name as unit_name, u.unit_number, u.estimated_minutes, s.name as subject_name, s.color as subject_color
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.user_id = ? AND r.scheduled_date = ? AND r.revision_number = 2 AND r.status != 'Completed'
    `).all(userId, todayStr);

    // Today's New Study Candidates (Units marked Studying or Not Started recommended)
    const newStudies = db.prepare(`
      SELECT u.id as unit_id, u.name as unit_name, u.unit_number, u.estimated_minutes, u.difficulty, u.status, s.id as subject_id, s.name as subject_name, s.color as subject_color
      FROM units u
      JOIN subjects s ON u.subject_id = s.id
      WHERE u.user_id = ? AND s.is_archived = 0 AND (u.status = 'Studying' OR u.status = 'Not Started')
      ORDER BY CASE WHEN u.status = 'Studying' THEN 0 ELSE 1 END, u.created_at ASC
      LIMIT 3
    `).all(userId);

    // Formatted Today Tasks list
    const todayTasks = [
      ...todayDay4Revisions.map(r => ({
        id: r.id,
        type: 'Day 4 Revision',
        taskBadge: '🔄 Revision 1',
        revisionNumber: 1,
        subjectId: r.subject_id,
        subjectName: r.subject_name,
        subjectColor: r.subject_color,
        unitId: r.unit_id,
        unitNumber: r.unit_number,
        unitName: r.unit_name,
        estimatedMinutes: 20,
        status: r.status,
        actionType: 'revise'
      })),
      ...todayDay7Revisions.map(r => ({
        id: r.id,
        type: 'Day 7 Revision',
        taskBadge: '🧠 Revision 2',
        revisionNumber: 2,
        subjectId: r.subject_id,
        subjectName: r.subject_name,
        subjectColor: r.subject_color,
        unitId: r.unit_id,
        unitNumber: r.unit_number,
        unitName: r.unit_name,
        estimatedMinutes: 20,
        status: r.status,
        actionType: 'revise'
      })),
      ...newStudies.map(u => ({
        id: u.unit_id,
        type: 'New Study',
        taskBadge: '📚 Learn',
        subjectId: u.subject_id,
        subjectName: u.subject_name,
        subjectColor: u.subject_color,
        unitId: u.unit_id,
        unitNumber: u.unit_number,
        unitName: u.unit_name,
        estimatedMinutes: u.estimated_minutes,
        status: u.status,
        actionType: 'study'
      }))
    ];

    // 3. Overdue Revisions List
    const overdueRevisions = db.prepare(`
      SELECT r.*, u.name as unit_name, u.unit_number, s.name as subject_name, s.color as subject_color, ss.study_date as original_study_date
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.user_id = ? AND r.scheduled_date < ? AND r.status != 'Completed'
      ORDER BY r.scheduled_date ASC
    `).all(userId, todayStr).map(r => ({
      ...r,
      days_overdue: calculateDaysLate(r.scheduled_date, todayStr)
    }));

    // 4. Upcoming Revisions (next 14 days)
    const [year, month, day] = todayStr.split('-').map(Number);
    const todayObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const maxDateStr = format(addDays(todayObj, 14), 'yyyy-MM-dd');

    const upcomingRevisions = db.prepare(`
      SELECT r.*, u.name as unit_name, u.unit_number, s.name as subject_name, s.color as subject_color
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.user_id = ? AND r.scheduled_date > ? AND r.scheduled_date <= ? AND r.status != 'Completed'
      ORDER BY r.scheduled_date ASC
      LIMIT 10
    `).all(userId, todayStr, maxDateStr);

    // 5. Subject Progress Cards
    const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ? AND is_archived = 0 ORDER BY created_at DESC').all(userId);
    const subjectProgress = subjects.map(s => {
      const units = db.prepare('SELECT status FROM units WHERE subject_id = ?').all(s.id);
      const total = units.length;
      const mastered = units.filter(u => u.status === 'Mastered').length;
      let score = 0;
      units.forEach(u => {
        if (u.status === 'Mastered') score += 100;
        else if (u.status === 'Revision 1 Completed') score += 66;
        else if (u.status === 'Revision Scheduled') score += 33;
        else if (u.status === 'Studying') score += 15;
      });
      const percent = total > 0 ? Math.round(score / total) : 0;
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        totalUnits: total,
        masteredUnits: mastered,
        progressPercent: percent
      };
    });

    // 6. Streak Info
    const streak = db.prepare('SELECT current_streak, longest_streak, last_activity_date FROM streaks WHERE user_id = ?').get(userId) || {
      current_streak: 0,
      longest_streak: 0
    };

    // 7. Recent Study Activity
    const recentStudies = db.prepare(`
      SELECT 'Day 1 Study' as session_type, ss.study_date as session_date, ss.duration_minutes, ss.completed_at, u.name as unit_name, u.unit_number, s.name as subject_name, s.color as subject_color, 'Completed' as status, NULL as performance
      FROM study_sessions ss
      JOIN units u ON ss.unit_id = u.id
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
      ORDER BY ss.completed_at DESC
      LIMIT 4
    `).all(userId);

    const recentRevisions = db.prepare(`
      SELECT r.stage_title as session_type, r.completed_at as session_date, r.duration_minutes, r.completed_at, u.name as unit_name, u.unit_number, s.name as subject_name, s.color as subject_color, r.status, r.performance
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.user_id = ? AND r.status = 'Completed'
      ORDER BY r.completed_at DESC
      LIMIT 4
    `).all(userId);

    const recentActivity = [...recentStudies, ...recentRevisions]
      .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
      .slice(0, 6);

    res.json({
      todayDate: todayStr,
      metrics: {
        totalSubjects,
        totalUnits,
        unitsStudied,
        revisionsCompleted: completedRevisions,
        totalRevisions,
        masteredUnits,
        pendingRevisions,
        overdueRevisions: overdueRevisionsCount,
        overallStudyProgress,
        revisionCompletionRate,
        onTimePercentage,
        totalStudyMinutes
      },
      today: {
        newStudyCount: newStudies.length,
        day4Count: todayDay4Revisions.length,
        day7Count: todayDay7Revisions.length,
        totalTasksCount: todayTasks.length,
        tasks: todayTasks
      },
      overdueRevisions,
      upcomingRevisions,
      subjectProgress,
      streak,
      recentActivity
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;
