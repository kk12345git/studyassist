const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get Notifications
router.get('/', (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, r.revision_number, r.stage_title, u.name as unit_name, s.name as subject_name
      FROM notifications n
      LEFT JOIN revision_sessions r ON n.revision_session_id = r.id
      LEFT JOIN units u ON r.unit_id = u.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      WHERE n.user_id = ?
      ORDER BY n.is_read ASC, n.scheduled_date DESC, n.created_at DESC
      LIMIT 30
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT count(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
});

// Mark single notification read
router.patch('/:id/read', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.post('/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

module.exports = router;
