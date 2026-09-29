const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// List all subjects for user with progress analytics
router.get('/', (req, res) => {
  try {
    const subjects = db.prepare(`
      SELECT * FROM subjects 
      WHERE user_id = ? 
      ORDER BY is_archived ASC, created_at DESC
    `).all(req.user.id);

    const enriched = subjects.map(subject => {
      const units = db.prepare('SELECT * FROM units WHERE subject_id = ?').all(subject.id);
      const totalUnits = units.length;
      
      const masteredUnits = units.filter(u => u.status === 'Mastered').length;
      const revision1Units = units.filter(u => u.status === 'Revision 1 Completed').length;
      const revisionScheduledUnits = units.filter(u => u.status === 'Revision Scheduled').length;
      const notStartedUnits = units.filter(u => u.status === 'Not Started').length;
      
      // Completed units count is units that have completed Day 1 (either scheduled revision, rev 1 done, or mastered)
      const studiedUnits = units.filter(u => u.status !== 'Not Started').length;
      const pendingUnits = units.filter(u => u.status !== 'Mastered').length;

      // Overall Progress Calculation:
      // Each unit has 3 milestone steps: Day 1 (33.3%), Day 4 (33.3%), Day 7 (33.3%)
      let progressPoints = 0;
      units.forEach(u => {
        if (u.status === 'Mastered') progressPoints += 100;
        else if (u.status === 'Revision 1 Completed') progressPoints += 66;
        else if (u.status === 'Revision Scheduled') progressPoints += 33;
        else if (u.status === 'Studying') progressPoints += 15;
      });

      const overallProgressPct = totalUnits > 0 ? Math.round(progressPoints / totalUnits) : 0;

      // Revision Progress
      const totalRevisions = db.prepare('SELECT count(*) as count FROM revision_sessions WHERE subject_id = ?').get(subject.id).count;
      const completedRevisions = db.prepare("SELECT count(*) as count FROM revision_sessions WHERE subject_id = ? AND status = 'Completed'").get(subject.id).count;

      return {
        ...subject,
        stats: {
          totalUnits,
          studiedUnits,
          masteredUnits,
          pendingUnits,
          revision1Units,
          revisionScheduledUnits,
          notStartedUnits,
          totalRevisions,
          completedRevisions,
          overallProgressPct
        }
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Fetch subjects error:', err);
    res.status(500).json({ error: 'Failed to retrieve subjects' });
  }
});

// Create Subject
router.post('/', (req, res) => {
  try {
    const { name, description = '', color = '#4F46E5' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const id = 'subj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO subjects (id, user_id, name, description, color, is_archived, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(id, req.user.id, name.trim(), description.trim(), color, now);

    const created = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create subject error:', err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// Update Subject
router.put('/:id', (req, res) => {
  try {
    const { name, description, color } = req.body;
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    db.prepare(`
      UPDATE subjects 
      SET name = ?, description = ?, color = ?
      WHERE id = ? AND user_id = ?
    `).run(
      name.trim(),
      description !== undefined ? description : subject.description,
      color || subject.color,
      req.params.id,
      req.user.id
    );

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    console.error('Update subject error:', err);
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// Archive / Unarchive Subject
router.patch('/:id/archive', (req, res) => {
  try {
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const nextArchived = subject.is_archived === 1 ? 0 : 1;
    db.prepare('UPDATE subjects SET is_archived = ? WHERE id = ?').run(nextArchived, req.params.id);

    res.json({ id: req.params.id, is_archived: nextArchived });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle archive state' });
  }
});

// Delete Subject
router.delete('/:id', (req, res) => {
  try {
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    db.prepare('DELETE FROM subjects WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
