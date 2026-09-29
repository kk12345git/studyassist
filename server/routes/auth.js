const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, timezone = 'UTC' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, timezone, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name.trim(), normalizedEmail, passwordHash, timezone, now);

    // Initial settings
    db.prepare(`
      INSERT INTO user_settings (id, user_id, timezone, reminder_time, browser_notifications_enabled, email_notifications_enabled)
      VALUES (?, ?, ?, '19:00', 1, 1)
    `).run('set_' + userId, userId, timezone);

    // Initial streak
    db.prepare(`
      INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_activity_date)
      VALUES (?, ?, 0, 0, NULL)
    `).run('strk_' + userId, userId);

    const token = jwt.sign({ id: userId, email: normalizedEmail, name: name.trim() }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.status(201).json({
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        timezone
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id) || {};

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone
      },
      settings
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please check your credentials.' });
  }
});

// Get Current User Profile & Settings
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, timezone, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id) || {};
    const streak = db.prepare('SELECT current_streak, longest_streak, last_activity_date FROM streaks WHERE user_id = ?').get(req.user.id) || {
      current_streak: 0,
      longest_streak: 0
    };

    return res.json({ user, settings, streak });
  } catch (err) {
    console.error('Auth check error:', err);
    return res.status(500).json({ error: 'Could not fetch user profile' });
  }
});

// Reset Demo Data
router.post('/reset-demo', authMiddleware, (req, res) => {
  try {
    // If demo user, wipe their subjects and re-run seed
    if (req.user.email === 'demo@studyassist.com') {
      db.prepare('DELETE FROM subjects WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM exam_plans WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
      
      const { seedDatabase } = require('../seed');
      seedDatabase();
      return res.json({ success: true, message: 'Demo data re-initialized' });
    }
    return res.json({ success: true, message: 'Only demo account can be reset' });
  } catch (err) {
    return res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

module.exports = router;
