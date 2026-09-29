const { addDays, parseISO, format, isValid, differenceInCalendarDays } = require('date-fns');

/**
 * 1-4-7 Spaced Revision Scheduling Algorithm
 * 
 * Given an initial study date (as 'YYYY-MM-DD' string or Date object):
 * - Day 1: Study Date (Learn)
 * - Day 4: Study Date + 3 calendar days (Revise #1)
 * - Day 7: Study Date + 6 calendar days (Revise #2)
 *
 * Example:
 * Study Date: 2026-09-29
 * Day 1 = 2026-09-29
 * Day 4 = 2026-10-02 (Study Date + 3 days)
 * Day 7 = 2026-10-05 (Study Date + 6 days)
 */

function toDateString(dateInput) {
  if (typeof dateInput === 'string') {
    // If it's already 'YYYY-MM-DD', validate and return
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const parsed = parseISO(dateInput);
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } else if (dateInput instanceof Date && isValid(dateInput)) {
    return format(dateInput, 'yyyy-MM-dd');
  }
  throw new Error(`Invalid date input for 1-4-7 calculation: ${dateInput}`);
}

function calculate147Schedule(studyDateInput) {
  const day1DateStr = toDateString(studyDateInput);
  
  // Use noon UTC or calendar date parsing to avoid timezone day shift issues
  const [year, month, day] = day1DateStr.split('-').map(Number);
  const baseDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Day 4 = Study Date + 3 calendar days
  const day4DateObj = addDays(baseDate, 3);
  const day4DateStr = format(day4DateObj, 'yyyy-MM-dd');

  // Day 7 = Study Date + 6 calendar days
  const day7DateObj = addDays(baseDate, 6);
  const day7DateStr = format(day7DateObj, 'yyyy-MM-dd');

  return {
    day1: {
      stage: 'DAY 1',
      action: 'Learn',
      date: day1DateStr
    },
    day4: {
      stage: 'DAY 4',
      action: 'Revise #1',
      revisionNumber: 1,
      date: day4DateStr
    },
    day7: {
      stage: 'DAY 7',
      action: 'Revise #2',
      revisionNumber: 2,
      date: day7DateStr
    }
  };
}

/**
 * Calculates days late for an overdue revision compared to scheduled date
 */
function calculateDaysLate(scheduledDateStr, completionDateStr = format(new Date(), 'yyyy-MM-dd')) {
  const [sy, sm, sd] = scheduledDateStr.split('-').map(Number);
  const [cy, cm, cd] = completionDateStr.split('-').map(Number);

  const schedDate = new Date(Date.UTC(sy, sm - 1, sd, 12, 0, 0));
  const compDate = new Date(Date.UTC(cy, cm - 1, cd, 12, 0, 0));

  const diff = differenceInCalendarDays(compDate, schedDate);
  return diff > 0 ? diff : 0;
}

/**
 * Check if a scheduled date is in the past relative to today
 */
function isDateOverdue(scheduledDateStr, todayStr = format(new Date(), 'yyyy-MM-dd')) {
  return scheduledDateStr < todayStr;
}

module.exports = {
  toDateString,
  calculate147Schedule,
  calculateDaysLate,
  isDateOverdue
};
