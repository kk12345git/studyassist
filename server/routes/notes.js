const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get Notes and Exam Questions for a unit
router.get('/:unitId', (req, res) => {
  try {
    const { unitId } = req.params;
    let note = db.prepare('SELECT * FROM notes WHERE unit_id = ? AND user_id = ?').get(unitId, req.user.id);

    if (!note) {
      // Auto-create blank note row
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO notes (id, user_id, unit_id, content, important_points, key_terms, questions_2m, questions_5m, questions_10m, updated_at)
        VALUES (?, ?, ?, '', '[]', '[]', '[]', '[]', '[]', ?)
      `).run('note_' + unitId, req.user.id, unitId, now);

      note = db.prepare('SELECT * FROM notes WHERE unit_id = ?').get(unitId);
    }

    res.json({
      id: note.id,
      unit_id: note.unit_id,
      content: note.content || '',
      important_points: JSON.parse(note.important_points || '[]'),
      key_terms: JSON.parse(note.key_terms || '[]'),
      questions_2m: JSON.parse(note.questions_2m || '[]'),
      questions_5m: JSON.parse(note.questions_5m || '[]'),
      questions_10m: JSON.parse(note.questions_10m || '[]'),
      updated_at: note.updated_at
    });
  } catch (err) {
    console.error('Fetch notes error:', err);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
});

// Update Notes and Exam Questions for a unit
router.put('/:unitId', (req, res) => {
  try {
    const { unitId } = req.params;
    const {
      content = '',
      important_points = [],
      key_terms = [],
      questions_2m = [],
      questions_5m = [],
      questions_10m = []
    } = req.body;

    const now = new Date().toISOString();
    const existing = db.prepare('SELECT id FROM notes WHERE unit_id = ? AND user_id = ?').get(unitId, req.user.id);

    const importantPointsJson = JSON.stringify(important_points);
    const keyTermsJson = JSON.stringify(key_terms);
    const q2mJson = JSON.stringify(questions_2m);
    const q5mJson = JSON.stringify(questions_5m);
    const q10mJson = JSON.stringify(questions_10m);

    if (existing) {
      db.prepare(`
        UPDATE notes
        SET content = ?, important_points = ?, key_terms = ?, questions_2m = ?, questions_5m = ?, questions_10m = ?, updated_at = ?
        WHERE unit_id = ? AND user_id = ?
      `).run(content, importantPointsJson, keyTermsJson, q2mJson, q5mJson, q10mJson, now, unitId, req.user.id);
    } else {
      db.prepare(`
        INSERT INTO notes (id, user_id, unit_id, content, important_points, key_terms, questions_2m, questions_5m, questions_10m, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('note_' + unitId, req.user.id, unitId, content, importantPointsJson, keyTermsJson, q2mJson, q5mJson, q10mJson, now);
    }

    res.json({
      success: true,
      message: 'Notes and Exam Questions saved successfully',
      updated_at: now
    });
  } catch (err) {
    console.error('Save notes error:', err);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

module.exports = router;
