# 1-4-7 Smart Study Guide

A modern, mobile-first spaced-revision study planner and memory consolidation web application built to implement the **1-4-7 Rule**.

---

## 🧠 The Core 1-4-7 Study Rule

When a student studies a Unit or Chapter on **Day 1**:

- **DAY 1: Initial Study (Learn)**
  - Student learns concepts, takes notes, derivations, and checks off tasks.
- **DAY 4: First Revision (Revise #1)**
  - **Calculation:** `Study Date + 3 calendar days`
  - *Example:* Studied on September 29 &rarr; First Revision on **October 2**.
  - Counters the steep initial drop of the Ebbinghaus forgetting curve.
- **DAY 7: Second Revision (Revise #2)**
  - **Calculation:** `Study Date + 6 calendar days`
  - *Example:* Studied on September 29 &rarr; Second Revision on **October 5**.
  - Consolidates knowledge into permanent long-term memory.
- **🏆 1-4-7 COMPLETED &rarr; MASTERED:**
  - When Day 1, Day 4, and Day 7 sessions are completed, the unit is automatically marked **Mastered**.

> [!IMPORTANT]
> Day 4 is strictly calculated as `Study Date + 3 days` (NOT +4 days).
> Day 7 is strictly calculated as `Study Date + 6 days`.
> If a revision is completed late, the days late are recorded (`days_late`), but the original schedule anchors remain visible.

---

## 🚀 Key Features

1. **Today's Study Dashboard:**
   - Real-time task queue: Today's New Study, Today's Day 4 Revisions, Today's Day 7 Revisions.
   - Overdue Alert Banner: Displays days overdue with a direct **"Revise Now"** button.
   - Subject-wise progress bars and overall curriculum mastery percentage.
   - Study Streak counter with active flame animation.

2. **Interactive Day 1 Study Session:**
   - Stopwatch / study timer with play, pause, and reset controls.
   - Interactive checklist with custom item additions and checkboxes.
   - Direct notes editor with key observations.
   - On completion: Automatic creation of Day 4 and Day 7 revision records + visual 1-4-7 timeline card.

3. **Active Recall Revision Session (Day 4 & Day 7):**
   - Active recall timer.
   - Embedded saved notes and university exam questions tabs.
   - Retention Feedback rating:
     - 😟 *Difficult*
     - 😐 *Average*
     - 🙂 *Good*
     - 🔥 *Excellent*
   - Confetti burst & **🏆 Mastered** badge award upon completing Revision #2.

4. **Curriculum & Unit Management:**
   - Subjects: Name, description, custom color palette, archive/unarchive, unit counters.
   - Units: Unit number, name, syllabus description, difficulty (Easy, Medium, Hard), estimated time, status badge.
   - Visual 1-4-7 timeline per unit showing Day 1, Day 4, and Day 7 completion states.

5. **Spaced Revision Calendar:**
   - Monthly interactive calendar showing color-coded event badges:
     - 📚 Day 1 Study
     - 🔄 Day 4 Revision
     - 🧠 Day 7 Revision
     - ⚠️ Overdue Alert
   - Click any date to view and launch scheduled sessions.

6. **Study & Revision History:**
   - Searchable, filterable audit log of every past session with date, subject, unit, duration, performance rating, and punctuality.

7. **University Exam Questions & Notes Repository:**
   - Comprehensive unit notes and important points list.
   - Key terms dictionary with definitions.
   - University exam questions categorized into:
     - **2-Mark Questions** (Definitions, short concepts)
     - **5-Mark Questions** (Analytical explanations)
     - **10-Mark Questions** (Comprehensive essay prompts)

8. **Target Exam Mode:**
   - Live exam countdown clock (Days, Hours remaining).
   - Remaining units, pending revisions, and target grade tracking.

9. **AI Study Assistant (Ready & Extensible):**
   - Generates 10 university-style revision questions (MCQs with explanations, 2-mark, 5-mark, 10-mark questions).
   - Generates unit summaries and interactive flashcards.
   - Detects weak topics from revision feedback ratings ("Difficult" / "Average").

10. **Reminder & Notification System:**
    - In-app notification bell with unread counter.
    - Browser Desktop Push Notifications via Web Notification API.
    - Configurable daily reminder time (Default: 7:00 PM).

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Node.js, Express, SQLite (`better-sqlite3` with WAL mode & foreign keys), JWT Auth, `bcryptjs`, `date-fns`.
- **Frontend:** React 19, TypeScript, Vite, Vanilla CSS design tokens with Glassmorphism, `lucide-react`, `canvas-confetti`.
- **Database Schema:** `users`, `subjects`, `units`, `study_sessions`, `revision_sessions`, `notifications`, `notes`, `exam_plans`, `user_settings`, `streaks`.

---

## 🏃 Getting Started

### 1. Run the Application

```bash
# Start production server (serves API and compiled frontend on port 5000)
npm start
```

Or for development with live reload:

```bash
npm run dev
```

Visit: **`http://localhost:5000`**

### 2. Demo Account (Pre-seeded)

- **Email:** `demo@studyassist.com`
- **Password:** `study123`
- Pre-seeded with **Regional Economics** (Units I to V):
  - Unit I: Studied on Day 1 &rarr; Day 4 & Day 7 revisions scheduled.
  - Unit II: Studied earlier &rarr; Day 4 revision is **1 day overdue** to demonstrate overdue recovery.
  - Unit III: Not started &rarr; Ready to test Day 1 session timer & schedule generation.
  - Unit I Notes: Pre-populated with 2-mark, 5-mark, and 10-mark exam questions.
  - Exam Mode: Set for **M.A. Economics University Final**.

---

## 🧪 Testing

Run the automated test suite:

```bash
npm test
```

### Verified Test Cases:
1. **Prompt example:** Study Date `2026-09-29` &rarr; Day 1: `2026-09-29`, Day 4: `2026-10-02`, Day 7: `2026-10-05`.
2. **Month boundaries:** Study on Jan 30 &rarr; Day 4: Feb 02, Day 7: Feb 05.
3. **Year boundaries:** Study on Dec 30 &rarr; Day 4: Jan 02, Day 7: Jan 05.
4. **Leap years:** Feb 27, 2028 (29 days) &rarr; Day 4: Mar 01, Day 7: Mar 04.
5. **Non-leap years:** Feb 27, 2027 (28 days) &rarr; Day 4: Mar 02, Day 7: Mar 05.
6. **Days late calculation:** Accurately computes overdue days without corrupting future schedules.
7. **End-to-End User Journey:** Registration &rarr; Subject Creation &rarr; Unit Creation &rarr; Day 1 Study &rarr; Auto-Scheduling &rarr; Day 4 Revision &rarr; Day 7 Revision &rarr; **🏆 Mastered** status.
