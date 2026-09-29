const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate147Schedule, calculateDaysLate, isDateOverdue } = require('../scheduler');

test('1-4-7 Rule - Exact Prompt Example: September 29, 2026', () => {
  const studyDate = '2026-09-29';
  const schedule = calculate147Schedule(studyDate);

  assert.equal(schedule.day1.stage, 'DAY 1');
  assert.equal(schedule.day1.action, 'Learn');
  assert.equal(schedule.day1.date, '2026-09-29', 'Day 1 must be the study date');

  assert.equal(schedule.day4.stage, 'DAY 4');
  assert.equal(schedule.day4.action, 'Revise #1');
  assert.equal(schedule.day4.date, '2026-10-02', 'Day 4 must be Study Date + 3 days (October 2)');

  assert.equal(schedule.day7.stage, 'DAY 7');
  assert.equal(schedule.day7.action, 'Revise #2');
  assert.equal(schedule.day7.date, '2026-10-05', 'Day 7 must be Study Date + 6 days (October 5)');
});

test('1-4-7 Rule - Month boundary transition', () => {
  // Studying on Jan 30
  const schedule = calculate147Schedule('2026-01-30');
  // Day 1: 2026-01-30
  // Day 4 (+3 days): 2026-02-02
  // Day 7 (+6 days): 2026-02-05
  assert.equal(schedule.day1.date, '2026-01-30');
  assert.equal(schedule.day4.date, '2026-02-02');
  assert.equal(schedule.day7.date, '2026-02-05');
});

test('1-4-7 Rule - Year boundary transition', () => {
  // Studying on Dec 30, 2026
  const schedule = calculate147Schedule('2026-12-30');
  // Day 1: 2026-12-30
  // Day 4 (+3 days): 2027-01-02
  // Day 7 (+6 days): 2027-01-05
  assert.equal(schedule.day1.date, '2026-12-30');
  assert.equal(schedule.day4.date, '2027-01-02');
  assert.equal(schedule.day7.date, '2027-01-05');
});

test('1-4-7 Rule - Leap year February (2028 is a leap year with 29 days)', () => {
  // Studying on Feb 27, 2028
  const schedule = calculate147Schedule('2028-02-27');
  // 27 + 1 = 28, + 2 = 29, + 3 = Mar 01
  assert.equal(schedule.day4.date, '2028-03-01');
  // 27 + 6 days = Mar 04
  assert.equal(schedule.day7.date, '2028-03-04');
});

test('1-4-7 Rule - Non-leap year February (2027 has 28 days)', () => {
  const schedule = calculate147Schedule('2027-02-27');
  // Feb 27 + 3 days in 2027: Feb 28 (1), Mar 1 (2), Mar 2 (3)
  assert.equal(schedule.day4.date, '2027-03-02');
  // Feb 27 + 6 days in 2027: Mar 05
  assert.equal(schedule.day7.date, '2027-03-05');
});

test('Days late calculation', () => {
  // Scheduled on Oct 2, completed on Oct 3 -> 1 day late
  assert.equal(calculateDaysLate('2026-10-02', '2026-10-03'), 1);

  // Scheduled on Oct 2, completed on Oct 5 -> 3 days late
  assert.equal(calculateDaysLate('2026-10-02', '2026-10-05'), 3);

  // Completed on time or early
  assert.equal(calculateDaysLate('2026-10-02', '2026-10-02'), 0);
  assert.equal(calculateDaysLate('2026-10-02', '2026-10-01'), 0);
});

test('Overdue detection', () => {
  const today = '2026-09-29';
  assert.equal(isDateOverdue('2026-09-28', today), true);
  assert.equal(isDateOverdue('2026-09-29', today), false);
  assert.equal(isDateOverdue('2026-09-30', today), false);
});
