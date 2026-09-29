const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId, type } = req.query;

    let studyQuery = `
      SELECT 
        ss.id,
        ss.study_date as date,
        'Day 1 Study' as session_type,
        ss.duration_minutes,
        ss.status,
        NULL as performance,
        0 as days_late,
        ss.notes,
        ss.completed_at,
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
    `;
    const studyParams = [userId];

    if (subjectId) {
      studyQuery += ' AND ss.subject_id = ?';
      studyParams.push(subjectId);
    }

    let revisionQuery = `
      SELECT 
        r.id,
        CASE WHEN r.completed_at IS NOT NULL THEN substr(r.completed_at, 1, 10) ELSE r.scheduled_date END as date,
        CASE WHEN r.revision_number = 1 THEN 'Day 4 Revision' ELSE 'Day 7 Revision' END as session_type,
        r.duration_minutes,
        r.status,
        r.performance,
        r.days_late,
        r.feedback_notes as notes,
        r.completed_at,
        u.id as unit_id,
        u.name as unit_name,
        u.unit_number,
        s.id as subject_id,
        s.name as subject_name,
        s.color as subject_color
      FROM revision_sessions r
      JOIN units u ON r.unit_id = u.id
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.user_id = ? AND r.status = 'Completed'
    `;
    const revParams = [userId];

    if (subjectId) {
      revisionQuery += ' AND r.subject_id = ?';
      revParams.push(subjectId);
    }

    const studies = (!type || type === 'all' || type === 'study') ? db.prepare(studyQuery).all(...studyParams) : [];
    const revisions = (!type || type === 'all' || type === 'revision') ? db.prepare(revisionQuery).all(...revParams) : [];

    const combined = [...studies, ...revisions].sort((a, b) => {
      const dateA = a.completed_at || a.date;
      const dateB = b.completed_at || b.date;
      return dateB.localeCompare(dateA);
    });

    res.json(combined);
  } catch (err) {
    console.error('Study history error:', err);
    res.status(500).json({ error: 'Failed to retrieve study history' });
  }
});

module.exports = router;
