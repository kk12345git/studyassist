const express = require('express');
const router = express.Router();
const { differenceInCalendarDays, parseISO, format } = require('date-fns');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { toDateString } = require('../scheduler');

router.use(authMiddleware);

// Get Exam Plans with live metrics
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const plans = db.prepare(`
      SELECT e.*, s.name as subject_name, s.color as subject_color
      FROM exam_plans e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ?
      ORDER BY e.exam_date ASC
    `).all(userId);

    const enriched = plans.map(plan => {
      const daysRemaining = differenceInCalendarDays(parseISO(plan.exam_date), parseISO(todayStr));

      // Calculate subject units
      const units = db.prepare('SELECT status FROM units WHERE subject_id = ?').all(plan.subject_id);
      const totalUnits = units.length;
      const completedUnits = units.filter(u => u.status === 'Mastered').length;
      const remainingUnits = totalUnits - completedUnits;

      // Revisions remaining
      const revisionsRemaining = db.prepare(`
        SELECT count(*) as count 
        FROM revision_sessions 
        WHERE subject_id = ? AND status != 'Completed'
      `).get(plan.subject_id).count;

      // Progress %
      let score = 0;
      units.forEach(u => {
        if (u.status === 'Mastered') score += 100;
        else if (u.status === 'Revision 1 Completed') score += 66;
        else if (u.status === 'Revision Scheduled') score += 33;
        else if (u.status === 'Studying') score += 15;
      });
      const progressPercent = totalUnits > 0 ? Math.round(score / totalUnits) : 0;

      return {
        ...plan,
        daysRemaining: Math.max(0, daysRemaining),
        isPast: daysRemaining < 0,
        totalUnits,
        completedUnits,
        remainingUnits,
        revisionsRemaining,
        progressPercent
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Exam plan error:', err);
    res.status(500).json({ error: 'Failed to retrieve exam plans' });
  }
});

// Create Exam Plan
router.post('/', (req, res) => {
  try {
    const { subject_id, exam_name, exam_date, target_score = '90%+', notes = '' } = req.body;

    if (!subject_id || !exam_name || !exam_date) {
      return res.status(400).json({ error: 'Subject, exam name, and target date are required' });
    }

    const id = 'exam_' + Date.now();
    const now = new Date().toISOString();
    const dateStr = toDateString(exam_date);

    db.prepare(`
      INSERT INTO exam_plans (id, user_id, subject_id, exam_name, exam_date, target_score, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, subject_id, exam_name.trim(), dateStr, target_score, notes.trim(), now);

    res.status(201).json({ id, message: 'Exam plan created' });
  } catch (err) {
    console.error('Create exam plan error:', err);
    res.status(500).json({ error: 'Failed to create exam plan' });
  }
});

// Delete Exam Plan
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM exam_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Exam plan removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete exam plan' });
  }
});

module.exports = router;
