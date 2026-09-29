const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get User Settings
router.get('/', (req, res) => {
  try {
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (!settings) {
      db.prepare(`
        INSERT INTO user_settings (id, user_id, timezone, reminder_time, browser_notifications_enabled, email_notifications_enabled, daily_digest_enabled)
        VALUES (?, ?, 'UTC', '19:00', 1, 1, 1)
      `).run('set_' + req.user.id, req.user.id);
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    }
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Update User Settings
router.put('/', (req, res) => {
  try {
    const {
      timezone = 'UTC',
      reminder_time = '19:00',
      browser_notifications_enabled = 1,
      email_notifications_enabled = 1,
      daily_digest_enabled = 1
    } = req.body;

    const existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(req.user.id);

    if (existing) {
      db.prepare(`
        UPDATE user_settings
        SET timezone = ?, reminder_time = ?, browser_notifications_enabled = ?, email_notifications_enabled = ?, daily_digest_enabled = ?
        WHERE user_id = ?
      `).run(
        timezone,
        reminder_time,
        browser_notifications_enabled ? 1 : 0,
        email_notifications_enabled ? 1 : 0,
        daily_digest_enabled ? 1 : 0,
        req.user.id
      );
    } else {
      db.prepare(`
        INSERT INTO user_settings (id, user_id, timezone, reminder_time, browser_notifications_enabled, email_notifications_enabled, daily_digest_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'set_' + req.user.id,
        req.user.id,
        timezone,
        reminder_time,
        browser_notifications_enabled ? 1 : 0,
        email_notifications_enabled ? 1 : 0,
        daily_digest_enabled ? 1 : 0
      );
    }

    const updated = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    res.json({ success: true, settings: updated });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
