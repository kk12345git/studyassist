const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'studyassist.db');
const db = new Database(dbPath);

// Enable WAL mode & foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      timezone TEXT DEFAULT 'UTC',
      reminder_time TEXT DEFAULT '19:00',
      browser_notifications_enabled INTEGER DEFAULT 1,
      email_notifications_enabled INTEGER DEFAULT 1,
      daily_digest_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#4F46E5',
      is_archived INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      unit_number TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
      estimated_minutes INTEGER DEFAULT 60,
      status TEXT CHECK(status IN ('Not Started', 'Studying', 'Revision Scheduled', 'Revision 1 Completed', 'Revision 2 Completed', 'Mastered')) DEFAULT 'Not Started',
      created_at TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      study_date TEXT NOT NULL, -- YYYY-MM-DD
      duration_minutes INTEGER NOT NULL,
      status TEXT DEFAULT 'Completed',
      notes TEXT,
      checklist TEXT, -- JSON array
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS revision_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      unit_id TEXT NOT NULL,
      study_session_id TEXT NOT NULL,
      revision_number INTEGER NOT NULL CHECK(revision_number IN (1, 2)),
      stage_title TEXT NOT NULL, -- 'Revise #1' or 'Revise #2'
      scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
      completed_at TEXT,
      status TEXT CHECK(status IN ('Pending', 'Completed', 'Overdue')) DEFAULT 'Pending',
      duration_minutes INTEGER DEFAULT 0,
      performance TEXT CHECK(performance IN ('Difficult', 'Average', 'Good', 'Excellent', NULL)),
      days_late INTEGER DEFAULT 0,
      feedback_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
      FOREIGN KEY (study_session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      revision_session_id TEXT,
      notification_type TEXT NOT NULL, -- 'day_4_reminder', 'day_7_reminder', 'overdue_reminder'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
      scheduled_time TEXT NOT NULL, -- HH:mm
      is_read INTEGER DEFAULT 0,
      sent_at TEXT,
      status TEXT DEFAULT 'Scheduled',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (revision_session_id) REFERENCES revision_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      unit_id TEXT UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      important_points TEXT DEFAULT '[]', -- JSON array
      key_terms TEXT DEFAULT '[]', -- JSON array of {term, definition}
      questions_2m TEXT DEFAULT '[]', -- JSON array
      questions_5m TEXT DEFAULT '[]', -- JSON array
      questions_10m TEXT DEFAULT '[]', -- JSON array
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exam_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      exam_date TEXT NOT NULL, -- YYYY-MM-DD
      target_score TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
    CREATE INDEX IF NOT EXISTS idx_rev_user_date ON revision_sessions(user_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_rev_unit ON revision_sessions(unit_id);
    CREATE INDEX IF NOT EXISTS idx_study_user ON study_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read);
  `);
}

initSchema();

module.exports = { db, initSchema };
