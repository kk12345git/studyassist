const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const { db } = require('../db');
const { calculate147Schedule } = require('../scheduler');

// Clean test user setup
const testEmail = 'journey_student_' + Date.now() + '@studyassist.com';
let authToken = '';
let userId = '';
let subjectId = '';
let unitId = '';
let rev1Id = '';
let rev2Id = '';

test('End-to-End User Journey: 1-4-7 Spaced Revision', async (t) => {
  // Helper for requests
  const TEST_PORT = 5055;
  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const res = await fetch(`http://localhost:${TEST_PORT}${path}`, {
      ...options,
      headers
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  // Ensure server is listening
  let server;
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => resolve());
  });

  try {
    // 1. Sign Up
    await t.test('1. User Registration', async () => {
      const { status, body } = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sarah Connor',
          email: testEmail,
          password: 'password123',
          timezone: 'Asia/Kolkata'
        })
      });

      assert.equal(status, 201);
      assert.ok(body.token);
      assert.equal(body.user.email, testEmail);
      authToken = body.token;
      userId = body.user.id;
    });

    // 2. Create Subject: Regional Economics
    await t.test('2. Create Subject', async () => {
      const { status, body } = await api('/api/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Regional Economics',
          description: 'Postgraduate study of regional growth & planning models',
          color: '#6366F1'
        })
      });

      assert.equal(status, 201);
      assert.equal(body.name, 'Regional Economics');
      subjectId = body.id;
    });

    // 3. Add Unit / Chapter
    await t.test('3. Add Unit / Chapter', async () => {
      const { status, body } = await api(`/api/subjects/${subjectId}/units`, {
        method: 'POST',
        body: JSON.stringify({
          unit_number: 'Unit I',
          name: 'Introduction to Regional Economics',
          description: 'Introduction to regional economics, administrative regions, planning regions...',
          difficulty: 'Medium',
          estimated_minutes: 60
        })
      });

      assert.equal(status, 201);
      assert.equal(body.unit_number, 'Unit I');
      assert.equal(body.status, 'Not Started');
      unitId = body.id;
    });

    // 4. Start Day 1 Study Session
    await t.test('4. Start Day 1 Study Session', async () => {
      const { status, body } = await api('/api/study/start', {
        method: 'POST',
        body: JSON.stringify({ unitId })
      });

      assert.equal(status, 200);
      assert.equal(body.status, 'Studying');
    });

    // 5. Complete Study on September 29, 2026 -> Auto-generates Day 4 (Oct 2) and Day 7 (Oct 5)
    await t.test('5. Complete Study Session & Auto-Generate 1-4-7 Schedule', async () => {
      const studyDate = '2026-09-29';
      const { status, body } = await api('/api/study/complete', {
        method: 'POST',
        body: JSON.stringify({
          unitId,
          subjectId,
          studyDate,
          durationMinutes: 55,
          notes: 'Covered planning regions and spatial friction',
          checklist: [{ id: '1', text: 'Read syllabus', done: true }]
        })
      });

      assert.equal(status, 201);
      assert.equal(body.unitStatus, 'Revision Scheduled');
      assert.equal(body.schedule.day1.date, '2026-09-29');
      assert.equal(body.schedule.day4.date, '2026-10-02', 'Day 4 must be Sept 29 + 3 days = Oct 2');
      assert.equal(body.schedule.day7.date, '2026-10-05', 'Day 7 must be Sept 29 + 6 days = Oct 5');

      assert.equal(body.revisions.length, 2);
      rev1Id = body.revisions[0].id;
      rev2Id = body.revisions[1].id;
    });

    // 6. Complete Revision #1 (Day 4)
    await t.test('6. Complete Revision #1 (Day 4)', async () => {
      const { status, body } = await api(`/api/revisions/${rev1Id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          performance: 'Good',
          durationMinutes: 18,
          completionDate: '2026-10-02',
          feedbackNotes: 'Good retention on functional regions'
        })
      });

      assert.equal(status, 200);
      assert.equal(body.revisionNumber, 1);
      assert.equal(body.unitStatus, 'Revision 1 Completed');
      assert.equal(body.isMastered, false, 'Unit is not mastered until Day 7 is completed');
    });

    // 7. Complete Revision #2 (Day 7) -> Triggers MASTERY
    await t.test('7. Complete Revision #2 (Day 7) -> Triggers Mastery', async () => {
      const { status, body } = await api(`/api/revisions/${rev2Id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          performance: 'Excellent',
          durationMinutes: 15,
          completionDate: '2026-10-05',
          feedbackNotes: 'Instant active recall of all key terms!'
        })
      });

      assert.equal(status, 200);
      assert.equal(body.revisionNumber, 2);
      assert.equal(body.unitStatus, 'Mastered');
      assert.equal(body.isMastered, true, 'Unit must be marked MASTERED when Day 1, Day 4, and Day 7 are completed');
    });

    // 8. Verify Dashboard Analytics
    await t.test('8. Verify Dashboard Analytics reflects Mastered unit', async () => {
      const { status, body } = await api('/api/dashboard?date=2026-10-05');
      assert.equal(status, 200);
      assert.equal(body.metrics.masteredUnits, 1);
      assert.equal(body.metrics.overallStudyProgress, 100);
      assert.equal(body.metrics.revisionsCompleted, 2);
    });

    // 9. Clean up test user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  } finally {
    server.close();
  }
});
