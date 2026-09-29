const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { calculate147Schedule } = require('./scheduler');

function seedDatabase() {
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@studyassist.com');
  if (existingUser) {
    console.log('Database already has demo user. Skipping seed.');
    return;
  }

  console.log('Seeding demo database...');

  const userId = 'user_demo_147';
  const passwordHash = bcrypt.hashSync('study123', 10);
  const now = new Date().toISOString();

  // 1. Create Demo User
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, timezone, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, 'Alex Morgan', 'demo@studyassist.com', passwordHash, 'Asia/Kolkata', now);

  // 2. User Settings
  db.prepare(`
    INSERT INTO user_settings (id, user_id, timezone, reminder_time, browser_notifications_enabled, email_notifications_enabled, daily_digest_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('settings_demo', userId, 'Asia/Kolkata', '19:00', 1, 1, 1);

  // 3. User Streak
  db.prepare(`
    INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_activity_date)
    VALUES (?, ?, ?, ?, ?)
  `).run('streak_demo', userId, 5, 12, '2026-09-29');

  // 4. Create Subject: Regional Economics
  const subjectId = 'subj_reg_econ';
  db.prepare(`
    INSERT INTO subjects (id, user_id, name, description, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    subjectId,
    userId,
    'Regional Economics',
    'University postgraduate syllabus on regional growth theories, spatial planning models, and economic development.',
    '#6366F1',
    now
  );

  // Second Subject for multi-subject progress demonstration
  const subject2Id = 'subj_micro_econ';
  db.prepare(`
    INSERT INTO subjects (id, user_id, name, description, color, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    subject2Id,
    userId,
    'Micro Economics',
    'Advanced consumer choice, general equilibrium, game theory, and market failure.',
    '#0EA5E9',
    now
  );

  // 5. Units for Regional Economics
  const unitsData = [
    {
      id: 'unit_reg_1',
      unit_number: 'Unit I',
      name: 'Introduction to Regional Economics',
      description: 'Introduction to regional economics, administrative regions, planning regions, agro-climatic regions and functional regions.',
      difficulty: 'Medium',
      estimated_minutes: 60,
      status: 'Revision Scheduled'
    },
    {
      id: 'unit_reg_2',
      unit_number: 'Unit II',
      name: 'Approaches to Regional Growth',
      description: 'Export base theory, neoclassical models, cumulative causation, and core-periphery dynamics.',
      difficulty: 'Hard',
      estimated_minutes: 75,
      status: 'Revision Scheduled'
    },
    {
      id: 'unit_reg_3',
      unit_number: 'Unit III',
      name: 'Regional Development',
      description: 'Growth pole theory of Perroux, Hirschman backward and forward linkages, Myrdal spread and backwash effects.',
      difficulty: 'Medium',
      estimated_minutes: 60,
      status: 'Not Started'
    },
    {
      id: 'unit_reg_4',
      unit_number: 'Unit IV',
      name: 'Regional Planning',
      description: 'Multi-level planning framework, decentralized district planning, and resource allocation models.',
      difficulty: 'Easy',
      estimated_minutes: 45,
      status: 'Not Started'
    },
    {
      id: 'unit_reg_5',
      unit_number: 'Unit V',
      name: 'Regional Policies',
      description: 'Industrial location policy, backward area development incentives, and regional disparity measures in India.',
      difficulty: 'Hard',
      estimated_minutes: 90,
      status: 'Not Started'
    }
  ];

  const insertUnitStmt = db.prepare(`
    INSERT INTO units (id, subject_id, user_id, unit_number, name, description, difficulty, estimated_minutes, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of unitsData) {
    insertUnitStmt.run(u.id, subjectId, userId, u.unit_number, u.name, u.description, u.difficulty, u.estimated_minutes, u.status, now);
  }

  // Units for Micro Economics
  const microUnits = [
    {
      id: 'unit_micro_1',
      unit_number: 'Unit I',
      name: 'Consumer Behavior & Revealed Preference',
      description: 'Axioms of revealed preference, Slutsky equation, and indirect utility functions.',
      difficulty: 'Medium',
      estimated_minutes: 60,
      status: 'Mastered'
    },
    {
      id: 'unit_micro_2',
      unit_number: 'Unit II',
      name: 'Production & Cost Analysis',
      description: 'CES production functions, returns to scale, and duality.',
      difficulty: 'Hard',
      estimated_minutes: 70,
      status: 'Not Started'
    }
  ];

  for (const u of microUnits) {
    insertUnitStmt.run(u.id, subject2Id, userId, u.unit_number, u.name, u.description, u.difficulty, u.estimated_minutes, u.status, now);
  }

  // 6. Seed Study Sessions & 1-4-7 Revision Sessions

  // Case A: Unit I studied on September 29, 2026 (TODAY)
  // Day 1: 2026-09-29 -> Completed
  // Day 4: 2026-10-02 -> Revision 1 Pending (Upcoming)
  // Day 7: 2026-10-05 -> Revision 2 Pending (Upcoming)
  const studySession1Id = 'study_sess_1';
  db.prepare(`
    INSERT INTO study_sessions (id, user_id, subject_id, unit_id, started_at, completed_at, study_date, duration_minutes, status, notes, checklist, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studySession1Id,
    userId,
    subjectId,
    'unit_reg_1',
    '2026-09-29T10:00:00Z',
    '2026-09-29T10:55:00Z',
    '2026-09-29',
    55,
    'Completed',
    'Covered definitions of planning regions vs functional regions. Emphasized agro-climatic zones classification for exam.',
    JSON.stringify([
      { id: '1', text: 'Define Regional Economics and its scope', done: true },
      { id: '2', text: 'Distinguish between administrative and functional regions', done: true },
      { id: '3', text: 'Review Planning Commission agro-climatic criteria', done: true }
    ]),
    now
  );

  const sched1 = calculate147Schedule('2026-09-29');

  // Day 4 Revision for Unit I (Oct 2)
  const rev1Id = 'rev_sess_1';
  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rev1Id,
    userId,
    subjectId,
    'unit_reg_1',
    studySession1Id,
    1,
    'Revise #1',
    sched1.day4.date,
    'Pending',
    now
  );

  // Day 7 Revision for Unit I (Oct 5)
  const rev2Id = 'rev_sess_2';
  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rev2Id,
    userId,
    subjectId,
    'unit_reg_1',
    studySession1Id,
    2,
    'Revise #2',
    sched1.day7.date,
    'Pending',
    now
  );

  // Case B: Unit II studied on September 25, 2026 -> Day 4 Revision was due on Sep 28 (OVERDUE by 1 day relative to Sep 29!)
  const studySession2Id = 'study_sess_2';
  db.prepare(`
    INSERT INTO study_sessions (id, user_id, subject_id, unit_id, started_at, completed_at, study_date, duration_minutes, status, notes, checklist, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studySession2Id,
    userId,
    subjectId,
    'unit_reg_2',
    '2026-09-25T14:00:00Z',
    '2026-09-25T15:10:00Z',
    '2026-09-25',
    70,
    'Completed',
    'Explored export base multiplier model and neoclassical factor mobility.',
    JSON.stringify([
      { id: '1', text: 'Export base model assumptions', done: true },
      { id: '2', text: 'Cumulative causation circular flow diagram', done: true }
    ]),
    now
  );

  const sched2 = calculate147Schedule('2026-09-25');
  // Day 4 was 2026-09-28 (Overdue!)
  const rev3Id = 'rev_sess_3';
  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rev3Id,
    userId,
    subjectId,
    'unit_reg_2',
    studySession2Id,
    1,
    'Revise #1',
    sched2.day4.date,
    'Overdue',
    now
  );

  // Day 7 is 2026-10-01
  const rev4Id = 'rev_sess_4';
  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    rev4Id,
    userId,
    subjectId,
    'unit_reg_2',
    studySession2Id,
    2,
    'Revise #2',
    sched2.day7.date,
    'Pending',
    now
  );

  // Case C: Unit Micro 1 - Mastered (Day 1 completed on Sep 10, Day 4 completed on Sep 13, Day 7 completed on Sep 16)
  const studySession3Id = 'study_sess_3';
  db.prepare(`
    INSERT INTO study_sessions (id, user_id, subject_id, unit_id, started_at, completed_at, study_date, duration_minutes, status, notes, checklist, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    studySession3Id,
    userId,
    subject2Id,
    'unit_micro_1',
    '2026-09-10T09:00:00Z',
    '2026-09-10T10:00:00Z',
    '2026-09-10',
    60,
    'Completed',
    'Samuelson WARP and SARP axioms.',
    JSON.stringify([{ id: '1', text: 'WARP formulation', done: true }]),
    now
  );

  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, completed_at, status, duration_minutes, performance, days_late, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_sess_5',
    userId,
    subject2Id,
    'unit_micro_1',
    studySession3Id,
    1,
    'Revise #1',
    '2026-09-13',
    '2026-09-13T18:30:00Z',
    'Completed',
    20,
    'Good',
    0,
    now
  );

  db.prepare(`
    INSERT INTO revision_sessions (id, user_id, subject_id, unit_id, study_session_id, revision_number, stage_title, scheduled_date, completed_at, status, duration_minutes, performance, days_late, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_sess_6',
    userId,
    subject2Id,
    'unit_micro_1',
    studySession3Id,
    2,
    'Revise #2',
    '2026-09-16',
    '2026-09-16T19:00:00Z',
    'Completed',
    18,
    'Excellent',
    0,
    now
  );

  // 7. Seed Notifications
  db.prepare(`
    INSERT INTO notifications (id, user_id, revision_session_id, notification_type, title, message, scheduled_date, scheduled_time, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'notif_1',
    userId,
    rev3Id,
    'overdue_reminder',
    '⚠️ Overdue Revision Alert',
    'Regional Economics: Unit II is 1 day overdue for Revise #1. Revise now to keep your memory sharp!',
    '2026-09-29',
    '09:00',
    0,
    now
  );

  db.prepare(`
    INSERT INTO notifications (id, user_id, revision_session_id, notification_type, title, message, scheduled_date, scheduled_time, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'notif_2',
    userId,
    rev1Id,
    'day_4_reminder',
    '📚 Revision Reminder (Day 4)',
    'Your first revision for Regional Economics - Unit I is scheduled for October 2.',
    '2026-10-02',
    '19:00',
    0,
    now
  );

  // 8. Seed Notes & University Exam Questions for Unit I
  db.prepare(`
    INSERT INTO notes (id, user_id, unit_id, content, important_points, key_terms, questions_2m, questions_5m, questions_10m, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'note_unit_1',
    userId,
    'unit_reg_1',
    `Regional economics integrates spatial dimensions into conventional macroeconomic and microeconomic analysis. While traditional economics assumes a 'point economy' where transport costs and spatial friction are zero, regional economics explicitly recognizes space, geography, distance, and localized agglomeration economies.`,
    JSON.stringify([
      'Regional economics addresses the "Where" of economic activity in addition to "What" and "For Whom".',
      'Homogeneous regions are delineated based on internal uniformity in key variables (e.g., per capita income, crop yield).',
      'Polarized or functional regions are defined by interdependent economic transactions gravitating around an urban nodal center.',
      'Planning regions must possess ecological unity, resource viability, and administrative feasibility.'
    ]),
    JSON.stringify([
      { term: 'Spatial Friction', definition: 'The economic resistance of distance manifested through transport and communication costs.' },
      { term: 'Functional Region', definition: 'An area held together by internal economic connectivity, commuting flows, and commercial linkages towards a nodal core.' },
      { term: 'Agro-Climatic Zone', definition: 'A land unit defined by major climate, soil types, and topography suited for designated cropping systems.' }
    ]),
    JSON.stringify([
      'Define Regional Economics according to Hoover.',
      'What is a nodal or polarized region?',
      'State two criteria used by the Planning Commission to identify backward regions in India.',
      'Differentiate between administrative and geographic regions.'
    ]),
    JSON.stringify([
      'Explain the characteristics and classification of planning regions with suitable examples.',
      'Compare homogeneous regions with functional regions in terms of delineation techniques.',
      'Discuss the significance of agro-climatic regional planning in sustainable agriculture.'
    ]),
    JSON.stringify([
      'Critically examine the need and rationale for regional economic planning in a diverse developing nation like India.',
      'Explain in detail the various techniques of regional delineation: Flow Analysis, Gravitational Models, and Factor Analysis.'
    ]),
    now
  );

  // 9. Seed Exam Plan
  db.prepare(`
    INSERT INTO exam_plans (id, user_id, subject_id, exam_name, exam_date, target_score, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'exam_1',
    userId,
    subjectId,
    'M.A. Economics University Final',
    '2026-10-25',
    '90%+',
    'Focus heavily on Unit II Growth Poles and Unit V Industrial Disparities in India.',
    now
  );

  console.log('Database seeded successfully with demo account: demo@studyassist.com / study123');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
