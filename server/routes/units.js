const express = require('express');
const router = express.Router({ mergeParams: true });
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get all units for a subject with their 1-4-7 revision schedules
router.get('/', (req, res) => {
  try {
    const { subjectId } = req.params;
    const units = db.prepare(`
      SELECT * FROM units 
      WHERE subject_id = ? AND user_id = ?
      ORDER BY rowid ASC
    `).all(subjectId, req.user.id);

    const enriched = units.map(unit => {
      // Find latest study session
      const studySession = db.prepare(`
        SELECT * FROM study_sessions 
        WHERE unit_id = ? 
        ORDER BY completed_at DESC LIMIT 1
      `).get(unit.id);

      // Find revisions
      const revisions = db.prepare(`
        SELECT * FROM revision_sessions 
        WHERE unit_id = ? 
        ORDER BY revision_number ASC
      `).all(unit.id);

      // Unit notes count
      const noteRecord = db.prepare('SELECT id, updated_at FROM notes WHERE unit_id = ?').get(unit.id);

      return {
        ...unit,
        studySession,
        revisions,
        hasNotes: !!noteRecord
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Fetch units error:', err);
    res.status(500).json({ error: 'Failed to retrieve units' });
  }
});

// Create Unit under subject
router.post('/', (req, res) => {
  try {
    const { subjectId } = req.params;
    const { unit_number, name, description = '', difficulty = 'Medium', estimated_minutes = 60 } = req.body;

    if (!unit_number || !unit_number.trim()) {
      return res.status(400).json({ error: 'Unit number is required (e.g. Unit I)' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Unit name is required' });
    }

    const id = 'unit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO units (id, subject_id, user_id, unit_number, name, description, difficulty, estimated_minutes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', ?)
    `).run(
      id,
      subjectId,
      req.user.id,
      unit_number.trim(),
      name.trim(),
      description.trim(),
      ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      Number(estimated_minutes) || 60,
      now
    );

    // Initialize blank notes record for this unit
    db.prepare(`
      INSERT INTO notes (id, user_id, unit_id, content, important_points, key_terms, questions_2m, questions_5m, questions_10m, updated_at)
      VALUES (?, ?, ?, '', '[]', '[]', '[]', '[]', '[]', ?)
    `).run('note_' + id, req.user.id, id, now);

    const created = db.prepare('SELECT * FROM units WHERE id = ?').get(id);
    res.status(201).json({ ...created, revisions: [], studySession: null });
  } catch (err) {
    console.error('Create unit error:', err);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// Get single unit with detailed timeline and notes
router.get('/:id', (req, res) => {
  try {
    const unit = db.prepare(`
      SELECT u.*, s.name as subject_name, s.color as subject_color 
      FROM units u 
      JOIN subjects s ON u.subject_id = s.id 
      WHERE u.id = ? AND u.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    const studySession = db.prepare('SELECT * FROM study_sessions WHERE unit_id = ? ORDER BY completed_at DESC LIMIT 1').get(unit.id);
    const revisions = db.prepare('SELECT * FROM revision_sessions WHERE unit_id = ? ORDER BY revision_number ASC').all(unit.id);
    const notes = db.prepare('SELECT * FROM notes WHERE unit_id = ?').get(unit.id);

    res.json({
      ...unit,
      studySession,
      revisions,
      notes
    });
  } catch (err) {
    console.error('Get unit error:', err);
    res.status(500).json({ error: 'Failed to fetch unit details' });
  }
});

// Update unit
router.put('/:id', (req, res) => {
  try {
    const { unit_number, name, description, difficulty, estimated_minutes } = req.body;
    const unit = db.prepare('SELECT * FROM units WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    db.prepare(`
      UPDATE units
      SET unit_number = ?, name = ?, description = ?, difficulty = ?, estimated_minutes = ?
      WHERE id = ? AND user_id = ?
    `).run(
      unit_number !== undefined ? unit_number.trim() : unit.unit_number,
      name !== undefined ? name.trim() : unit.name,
      description !== undefined ? description.trim() : unit.description,
      ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : unit.difficulty,
      estimated_minutes !== undefined ? Number(estimated_minutes) : unit.estimated_minutes,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM units WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// Delete unit
router.delete('/:id', (req, res) => {
  try {
    const unit = db.prepare('SELECT * FROM units WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    db.prepare('DELETE FROM units WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Unit deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

module.exports = router;
