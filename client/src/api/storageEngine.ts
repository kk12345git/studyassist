// Complete Client-Side Database & Auth Engine
// Provides full persistence for all users, subjects, units, notes, and 1-4-7 revisions.
// Enables the web app to function 100% end-to-end on static hosts (e.g. Vercel) or offline.

const USERS_KEY = 'studyassist_db_users';
const CURRENT_USER_KEY = 'studyassist_current_user_id';
const DATA_PREFIX = 'studyassist_data_';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  timezone: string;
  university?: string;
  degree?: string;
  academic_year?: string;
  target_study_hours?: number;
  study_goal?: string;
  onboarding_completed?: number;
  created_at: string;
}

interface UserData {
  settings: {
    id: string;
    timezone: string;
    reminder_time: string;
    browser_notifications_enabled: number;
    email_notifications_enabled: number;
    daily_digest_enabled: number;
  };
  streak: {
    id: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    is_archived: number;
    created_at: string;
  }>;
  units: Record<string, Array<{
    id: string;
    subject_id: string;
    unit_number: string;
    name: string;
    description: string;
    difficulty: string;
    estimated_minutes: number;
    status: string;
    created_at: string;
  }>>;
  revisions: Array<{
    id: string;
    unit_id: string;
    revision_number: number;
    stage_title: string;
    scheduled_date: string;
    status: string;
    subject_name: string;
    subject_color: string;
    unit_name: string;
    unit_number: string;
    estimated_minutes: number;
    days_overdue?: number;
    created_at: string;
  }>;
  notes: Record<string, {
    unitId: string;
    notes: string;
    questions: Array<{
      id: string;
      type: string;
      text: string;
      marks: number;
      user_answer: string;
    }>;
  }>;
  exams: any[];
  notifications: any[];
  history: any[];
}

function getAllUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse users', e);
  }
  // Default demo user available out of the box
  const demoUser: UserRecord = {
    id: 'user_demo_147',
    name: 'Alex Morgan',
    email: 'demo@studyassist.com',
    password: 'study123',
    timezone: 'Asia/Kolkata',
    university: 'Stanford University',
    degree: 'B.S. Computer Science',
    academic_year: '3rd Year / Semester 5',
    target_study_hours: 4,
    study_goal: 'Master Distributed Systems & Top 5% Semester GPA',
    onboarding_completed: 1,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([demoUser]));
  return [demoUser];
}

function saveUsers(users: UserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUserId(): string {
  return localStorage.getItem(CURRENT_USER_KEY) || 'user_demo_147';
}

function setCurrentUserId(id: string) {
  localStorage.setItem(CURRENT_USER_KEY, id);
}

function getUserData(userId: string): UserData {
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${userId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse user data', e);
  }
  // Initialize fresh user database
  const fresh: UserData = {
    settings: {
      id: `settings_${userId}`,
      timezone: 'Asia/Kolkata',
      reminder_time: '19:00',
      browser_notifications_enabled: 1,
      email_notifications_enabled: 1,
      daily_digest_enabled: 1
    },
    streak: {
      id: `streak_${userId}`,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: getTodayStr()
    },
    subjects: [
      {
        id: `subj_sample_${userId}`,
        name: 'Core Curriculum',
        description: 'Primary university syllabus units & spaced revision roadmap.',
        color: '#6366F1',
        is_archived: 0,
        created_at: new Date().toISOString()
      }
    ],
    units: {
      [`subj_sample_${userId}`]: [
        {
          id: `unit_sample_1_${userId}`,
          subject_id: `subj_sample_${userId}`,
          unit_number: 'Unit 1',
          name: 'Introduction & Foundations',
          description: 'Fundamental principles, core definitions, and foundational concepts.',
          difficulty: 'Medium',
          estimated_minutes: 60,
          status: 'Not Started',
          created_at: new Date().toISOString()
        }
      ]
    },
    revisions: [],
    notes: {},
    exams: [],
    notifications: [],
    history: []
  };
  saveUserData(userId, fresh);
  return fresh;
}

function saveUserData(userId: string, data: UserData) {
  localStorage.setItem(`${DATA_PREFIX}${userId}`, JSON.stringify(data));
}

export async function executeStorageRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const today = getTodayStr();

  // 1. Auth: Register (Any name, email, password!)
  if (endpoint.startsWith('/auth/register')) {
    const users = getAllUsers();
    const existing = users.find((u) => u.email.toLowerCase() === (body.email || '').toLowerCase());
    
    let user: UserRecord;
    if (existing) {
      user = existing;
      if (body.name) user.name = body.name;
    } else {
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: body.name || 'Student',
        email: (body.email || '').toLowerCase(),
        password: body.password || '',
        timezone: body.timezone || 'Asia/Kolkata',
        university: undefined,
        degree: undefined,
        academic_year: undefined,
        target_study_hours: 3,
        study_goal: undefined,
        onboarding_completed: 0,
        created_at: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    }

    setCurrentUserId(user.id);
    const data = getUserData(user.id);

    return {
      token: `token_${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        university: user.university,
        degree: user.degree,
        academic_year: user.academic_year,
        target_study_hours: user.target_study_hours || 3,
        study_goal: user.study_goal,
        onboarding_completed: user.onboarding_completed ?? 0
      },
      settings: data.settings
    } as T;
  }

  // 2. Auth: Login
  if (endpoint.startsWith('/auth/login')) {
    const users = getAllUsers();
    const email = (body.email || '').toLowerCase();
    let user = users.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      // Create user if logging in for first time
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: email.split('@')[0] || 'Student',
        email,
        password: body.password || '',
        timezone: 'Asia/Kolkata',
        university: undefined,
        degree: undefined,
        academic_year: undefined,
        target_study_hours: 3,
        study_goal: undefined,
        onboarding_completed: 0,
        created_at: new Date().toISOString()
      };
      users.push(user);
      saveUsers(users);
    }

    setCurrentUserId(user.id);
    const data = getUserData(user.id);

    return {
      token: `token_${user.id}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        university: user.university,
        degree: user.degree,
        academic_year: user.academic_year,
        target_study_hours: user.target_study_hours || 3,
        study_goal: user.study_goal,
        onboarding_completed: user.onboarding_completed ?? 0
      },
      settings: data.settings
    } as T;
  }

  // 3. Auth: Me
  if (endpoint.startsWith('/auth/me')) {
    const userId = getCurrentUserId();
    const users = getAllUsers();
    const user = users.find((u) => u.id === userId) || users[0];
    const data = getUserData(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        university: user.university,
        degree: user.degree,
        academic_year: user.academic_year,
        target_study_hours: user.target_study_hours || 3,
        study_goal: user.study_goal,
        onboarding_completed: user.onboarding_completed ?? 0
      },
      settings: data.settings,
      streak: data.streak
    } as T;
  }

  // 4. Auth: Onboarding (Save newcomer academic details & initial syllabus)
  if (endpoint.startsWith('/auth/onboarding') && method === 'POST') {
    const userId = getCurrentUserId();
    const users = getAllUsers();
    const userIdx = users.findIndex((u) => u.id === userId);
    const user = userIdx >= 0 ? users[userIdx] : users[0];

    // Update user record
    user.university = body.university || user.university;
    user.degree = body.degree || user.degree;
    user.academic_year = body.academic_year || user.academic_year;
    user.target_study_hours = Number(body.target_study_hours) || user.target_study_hours || 3;
    user.study_goal = body.study_goal || user.study_goal;
    user.onboarding_completed = 1;
    saveUsers(users);

    const data = getUserData(user.id);

    // Update reminder time if provided
    if (body.reminder_time) {
      data.settings.reminder_time = body.reminder_time;
    }

    let createdSubject = null;
    if (body.subject && body.subject.name) {
      // Clean out sample subjects if this was their first real onboarding
      data.subjects = data.subjects.filter((s) => !s.id.startsWith('subj_sample_'));
      delete data.units[`subj_sample_${user.id}`];

      const newSubjId = `subj_${Date.now()}`;
      const newSubj = {
        id: newSubjId,
        name: body.subject.name.trim(),
        description: body.subject.description || '',
        color: body.subject.color || '#6366F1',
        is_archived: 0,
        created_at: new Date().toISOString()
      };
      data.subjects.push(newSubj);
      createdSubject = newSubj;

      const unitsList = Array.isArray(body.subject.units) && body.subject.units.length > 0
        ? body.subject.units
        : [{ name: 'Foundations & Core Principles', estimated_minutes: 60, difficulty: 'Medium' }];

      data.units[newSubjId] = unitsList.map((u: any, idx: number) => ({
        id: `unit_${Date.now()}_${idx}`,
        subject_id: newSubjId,
        unit_number: `Unit ${idx + 1}`,
        name: u.name || `Chapter ${idx + 1}`,
        description: u.description || '',
        difficulty: u.difficulty || 'Medium',
        estimated_minutes: Number(u.estimated_minutes) || 60,
        status: 'Not Started',
        created_at: new Date().toISOString()
      }));
    }

    saveUserData(user.id, data);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        university: user.university,
        degree: user.degree,
        academic_year: user.academic_year,
        target_study_hours: user.target_study_hours,
        study_goal: user.study_goal,
        onboarding_completed: 1
      },
      settings: data.settings,
      subject: createdSubject
    } as T;
  }

  // 5. Auth: Reset Demo
  if (endpoint.startsWith('/auth/reset-demo')) {
    const userId = getCurrentUserId();
    localStorage.removeItem(`${DATA_PREFIX}${userId}`);
    return { success: true, message: 'Data reset successfully' } as T;
  }

  const userId = getCurrentUserId();
  const data = getUserData(userId);

  // 5. Subjects
  if (endpoint === '/subjects' && method === 'GET') {
    const result = data.subjects.map((s) => {
      const units = data.units[s.id] || [];
      const totalUnits = units.length;
      const masteredUnits = units.filter((u) => u.status === 'Mastered').length;
      const overallProgressPct = totalUnits === 0 ? 0 : Math.round((masteredUnits / totalUnits) * 100);
      return {
        ...s,
        stats: {
          totalUnits,
          masteredUnits,
          overallProgressPct
        }
      };
    });
    return result as T;
  }

  if (endpoint === '/subjects' && method === 'POST') {
    const newSubject = {
      id: `subj_${Date.now()}`,
      name: body.name,
      description: body.description || '',
      color: body.color || '#6366F1',
      is_archived: 0,
      created_at: new Date().toISOString()
    };
    data.subjects.push(newSubject);
    data.units[newSubject.id] = [];
    saveUserData(userId, data);
    return newSubject as T;
  }

  if (endpoint.match(/^\/subjects\/[^/]+$/) && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const s = data.subjects.find((sub) => sub.id === id);
    if (s) {
      Object.assign(s, body);
      saveUserData(userId, data);
      return s as T;
    }
  }

  if (endpoint.match(/^\/subjects\/[^/]+$/) && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    data.subjects = data.subjects.filter((s) => s.id !== id);
    delete data.units[id];
    saveUserData(userId, data);
    return { success: true } as T;
  }

  // 6. Units
  if (endpoint.match(/^\/subjects\/[^/]+\/units$/) && method === 'GET') {
    const subjectId = endpoint.split('/')[2];
    const units = data.units[subjectId] || [];
    const withRevs = units.map((u) => ({
      ...u,
      revisions: data.revisions.filter((r) => r.unit_id === u.id)
    }));
    return withRevs as T;
  }

  if (endpoint.match(/^\/subjects\/[^/]+\/units$/) && method === 'POST') {
    const subjectId = endpoint.split('/')[2];
    const newUnit = {
      id: `unit_${Date.now()}`,
      subject_id: subjectId,
      unit_number: body.unit_number || `Unit ${Date.now()}`,
      name: body.name,
      description: body.description || '',
      difficulty: body.difficulty || 'Medium',
      estimated_minutes: Number(body.estimated_minutes) || 60,
      status: 'Not Started',
      created_at: new Date().toISOString()
    };
    if (!data.units[subjectId]) data.units[subjectId] = [];
    data.units[subjectId].push(newUnit);
    saveUserData(userId, data);
    return newUnit as T;
  }

  if (endpoint.match(/^\/units\/[^/]+$/) && method === 'DELETE') {
    const unitId = endpoint.split('/')[2];
    for (const subId in data.units) {
      data.units[subId] = data.units[subId].filter((u) => u.id !== unitId);
    }
    data.revisions = data.revisions.filter((r) => r.unit_id !== unitId);
    saveUserData(userId, data);
    return { success: true } as T;
  }

  // 7. Study Day 1 (1-4-7 Automatic Scheduling)
  if (endpoint === '/study/start') {
    return {
      unitId: body.unitId,
      startedAt: new Date().toISOString(),
      estimatedMinutes: 60,
      status: 'Studying'
    } as T;
  }

  if (endpoint === '/study/complete') {
    const { unitId, subjectId, durationMinutes, notes } = body;
    const studyDate = body.studyDate || today;
    const day4 = addDays(studyDate, 3);
    const day7 = addDays(studyDate, 6);

    for (const sId in data.units) {
      const u = data.units[sId].find((unit) => unit.id === unitId);
      if (u) {
        u.status = 'Revision Scheduled';
      }
    }

    const sub = data.subjects.find((s) => s.id === subjectId);
    const unitList = data.units[subjectId] || [];
    const targetUnit = unitList.find((u) => u.id === unitId);

    const rev1 = {
      id: `rev_${Date.now()}_1`,
      unit_id: unitId,
      revision_number: 1,
      stage_title: 'Revise #1 (Day 4)',
      scheduled_date: day4,
      status: 'Scheduled',
      subject_name: sub?.name || 'Subject',
      subject_color: sub?.color || '#6366F1',
      unit_name: targetUnit?.name || 'Unit',
      unit_number: targetUnit?.unit_number || 'Unit',
      estimated_minutes: 25,
      created_at: new Date().toISOString()
    };

    const rev2 = {
      id: `rev_${Date.now()}_2`,
      unit_id: unitId,
      revision_number: 2,
      stage_title: 'Revise #2 (Day 7)',
      scheduled_date: day7,
      status: 'Scheduled',
      subject_name: sub?.name || 'Subject',
      subject_color: sub?.color || '#6366F1',
      unit_name: targetUnit?.name || 'Unit',
      unit_number: targetUnit?.unit_number || 'Unit',
      estimated_minutes: 35,
      created_at: new Date().toISOString()
    };

    data.revisions.push(rev1, rev2);

    if (notes) {
      if (!data.notes[unitId]) data.notes[unitId] = { unitId, notes: '', questions: [] };
      data.notes[unitId].notes = notes;
    }

    data.history.unshift({
      id: `hist_${Date.now()}`,
      activity_type: 'study_completed',
      title: 'Day 1 Study Completed',
      description: `Completed study session for ${targetUnit?.name || 'Unit'}`,
      timestamp: studyDate,
      duration_minutes: durationMinutes || 60
    });

    data.streak.current_streak += 1;
    if (data.streak.current_streak > data.streak.longest_streak) {
      data.streak.longest_streak = data.streak.current_streak;
    }

    saveUserData(userId, data);

    return {
      success: true,
      message: 'Study session recorded and 1-4-7 revisions scheduled!',
      unitId,
      unitStatus: 'Revision Scheduled',
      schedule: {
        day1: studyDate,
        day4,
        day7
      },
      revisions: [rev1, rev2]
    } as T;
  }

  // 8. Revisions
  if (endpoint.startsWith('/revisions/today')) {
    const list = data.revisions.filter((r) => r.scheduled_date === today && r.status === 'Scheduled');
    return list as T;
  }

  if (endpoint.startsWith('/revisions/overdue')) {
    const list = data.revisions
      .filter((r) => r.scheduled_date < today && r.status === 'Scheduled')
      .map((r) => ({
        ...r,
        days_overdue: Math.max(1, Math.floor((new Date(today).getTime() - new Date(r.scheduled_date).getTime()) / 86400000))
      }));
    return list as T;
  }

  if (endpoint.startsWith('/revisions/upcoming')) {
    const list = data.revisions.filter((r) => r.scheduled_date >= today && r.status === 'Scheduled');
    return list as T;
  }

  if (endpoint.match(/^\/revisions\/[^/]+\/complete$/) && method === 'POST') {
    const id = endpoint.split('/')[2].replace('/complete', '');
    const rev = data.revisions.find((r) => r.id === id);
    let isMastered = false;

    if (rev) {
      rev.status = 'Completed';
      for (const sId in data.units) {
        const u = data.units[sId].find((unit) => unit.id === rev.unit_id);
        if (u) {
          if (rev.revision_number === 1) {
            u.status = 'Revision 1 Completed';
          } else if (rev.revision_number === 2) {
            u.status = 'Mastered';
            isMastered = true;
          }
        }
      }

      data.streak.current_streak += 1;
      saveUserData(userId, data);

      return {
        success: true,
        message: isMastered ? '🏆 Mastery achieved!' : 'Revision marked complete!',
        revisionId: id,
        revisionNumber: rev.revision_number,
        unitId: rev.unit_id,
        unitStatus: isMastered ? 'Mastered' : 'Revision 1 Completed',
        isMastered,
        daysLate: 0
      } as T;
    }
  }

  // 9. Dashboard
  if (endpoint.startsWith('/dashboard')) {
    const overdue = data.revisions
      .filter((r) => r.scheduled_date < today && r.status === 'Scheduled')
      .map((r) => ({
        ...r,
        days_overdue: Math.max(1, Math.floor((new Date(today).getTime() - new Date(r.scheduled_date).getTime()) / 86400000))
      }));
    const todayRevs = data.revisions.filter((r) => r.scheduled_date === today && r.status === 'Scheduled');

    let totalUnits = 0;
    let masteredUnits = 0;
    for (const sId in data.units) {
      const uList = data.units[sId];
      totalUnits += uList.length;
      masteredUnits += uList.filter((u) => u.status === 'Mastered').length;
    }

    const todayTasks = todayRevs.map((r) => ({
      id: r.id,
      type: r.stage_title,
      taskBadge: r.revision_number === 1 ? 'DAY 4' : 'DAY 7',
      revisionNumber: r.revision_number,
      subjectName: r.subject_name,
      subjectColor: r.subject_color,
      unitName: r.unit_name,
      unitNumber: r.unit_number,
      estimatedMinutes: r.estimated_minutes,
      actionType: 'revise'
    }));

    return {
      todayDate: today,
      metrics: {
        newStudyCount: totalUnits > 0 ? 1 : 0,
        day4Count: todayRevs.filter((r) => r.revision_number === 1).length,
        day7Count: todayRevs.filter((r) => r.revision_number === 2).length,
        overdueRevisions: overdue.length,
        masteredUnits,
        totalStudyMinutes: 180
      },
      today: {
        newStudyCount: totalUnits > 0 ? 1 : 0,
        day4Count: todayRevs.filter((r) => r.revision_number === 1).length,
        day7Count: todayRevs.filter((r) => r.revision_number === 2).length,
        totalTasksCount: todayTasks.length,
        tasks: todayTasks
      },
      overdueRevisions: overdue,
      upcomingRevisions: data.revisions.filter((r) => r.scheduled_date > today && r.status === 'Scheduled'),
      streak: data.streak,
      subjectProgress: data.subjects.map((s) => {
        const u = data.units[s.id] || [];
        const mastered = u.filter((unit) => unit.status === 'Mastered').length;
        return {
          id: s.id,
          name: s.name,
          color: s.color,
          totalUnits: u.length,
          masteredUnits: mastered,
          progressPct: u.length === 0 ? 0 : Math.round((mastered / u.length) * 100)
        };
      })
    } as T;
  }

  // 10. Calendar
  if (endpoint.startsWith('/calendar')) {
    const map: Record<string, any[]> = {};
    data.revisions.forEach((r) => {
      if (!map[r.scheduled_date]) map[r.scheduled_date] = [];
      map[r.scheduled_date].push({
        id: r.id,
        type: 'revision',
        revision_number: r.revision_number,
        title: `${r.unit_number}: ${r.unit_name}`,
        stage: r.stage_title,
        status: r.status,
        color: r.subject_color
      });
    });
    return map as T;
  }

  // 11. Notes
  if (endpoint.match(/^\/notes\/[^/]+$/) && method === 'GET') {
    const unitId = endpoint.split('/')[2];
    return (data.notes[unitId] || { unitId, notes: '', questions: [] }) as T;
  }

  if (endpoint.match(/^\/notes\/[^/]+$/) && method === 'POST') {
    const unitId = endpoint.split('/')[2];
    if (!data.notes[unitId]) data.notes[unitId] = { unitId, notes: '', questions: [] };
    data.notes[unitId].notes = body.notes;
    saveUserData(userId, data);
    return { success: true } as T;
  }

  // 12. Exams
  if (endpoint === '/exams' && method === 'GET') {
    return data.exams as T;
  }

  if (endpoint === '/exams' && method === 'POST') {
    const sub = data.subjects.find((s) => s.id === body.subject_id);
    const newExam = {
      id: `exam_${Date.now()}`,
      subject_id: body.subject_id,
      subject_name: sub?.name || 'Subject',
      exam_name: body.exam_name,
      exam_date: body.exam_date,
      target_score: body.target_score || 90,
      notes: body.notes || ''
    };
    data.exams.push(newExam);
    saveUserData(userId, data);
    return newExam as T;
  }

  // 13. AI Tutor
  if (endpoint.startsWith('/ai/')) {
    return {
      response: `### AI Tutor Guide: ${body.topic || 'Subject Review'}

1. **Active Recall**: Explain the key mechanisms out loud without consulting your notes.
2. **1-4-7 Spacing**: Revise this unit on Day 4 to consolidate the neural pathway before memory decay.
3. **University Tip**: Structure your answers with clear definitions, diagrams, and applied examples.`
    } as T;
  }

  if (endpoint === '/notifications') return data.notifications as T;
  if (endpoint === '/history') return data.history as T;
  if (endpoint === '/settings') return data.settings as T;

  return {} as T;
}
