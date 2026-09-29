const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { format } = require('date-fns');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Day 1 Study Sessions (Past or today)
    const studies = db.prepare(`
      SELECT 
        ss.id,
        ss.study_date as date,
        'Day 1 Study' as event_type,
        '📚 Study' as badge,
        'study' as category,
        ss.duration_minutes,
        ss.status,
        u.id as unit_id,
        u.name as unit_name,
        u.unit_number,
        s.id as subject_id,
        s.name as subject_name,
        s.color as subject_color
      FROM study_sessions ss
      JOIN units u ON ss.unit_id = u.id
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
    `).all(userId);

    // 2. Revisions (Day 4 & Day 7, past, today, or future)
    const revisions = db.prepare(`
      SELECT 
        r.id,
        r.scheduled_date as date,
        r.stage_title as event_type,
        CASE 
          WHEN r.status = 'Completed' THEN '✅ ' || r.stage_title
          WHEN r.scheduled_date < ? AND r.status != 'Completed' THEN '⚠️ Overdue ' || r.stage_title
          WHEN r.revision_number = 1 THEN '🔄 ' || r.stage_title
          ELSE '🧠 ' || r.stage_title
        END as badge,
        CASE 
          WHEN r.scheduled_date < ? AND r.status != 'Completed' THEN 'overdue'
          WHEN r.revision_number = 1 THEN 'rev1'
          ELSE 'rev2'
        END as category,
        r.revision_number,
        r.status,
        r.completed_at,
        r.performance,
        r.days_late,
        u.id as unit_id,
        u.name as unit_name,
        u.unit_number,
        s.id as subject_id,
        s.name as subject_name,
        s.color as subject_color,
        ss.study_date as original_study_date
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      JOIN study_sessions ss ON r.study_session_id = ss.id
      WHERE r.user_id = ?
    `).all(todayStr, todayStr, userId);

    // 3. Exam Plans
    const exams = db.prepare(`
      SELECT 
        e.id,
        e.exam_date as date,
        'Target Exam' as event_type,
        '🎯 ' || e.exam_name as badge,
        'exam' as category,
        'Exam' as status,
        NULL as unit_id,
        e.exam_name as unit_name,
        '' as unit_number,
        s.id as subject_id,
        s.name as subject_name,
        s.color as subject_color
      FROM exam_plans e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ?
    `).all(userId);

    const allEvents = [...studies, ...revisions, ...exams].sort((a, b) => a.date.localeCompare(b.date));

    // Group events by date string (YYYY-MM-DD)
    const byDate = {};
    for (const evt of allEvents) {
      if (!byDate[evt.date]) {
        byDate[evt.date] = [];
      }
      byDate[evt.date].push(evt);
    }

    res.json({
      events: allEvents,
      byDate
    });
  } catch (err) {
    console.error('Calendar error:', err);
    res.status(500).json({ error: 'Failed to load calendar events' });
  }
});

module.exports = router;
