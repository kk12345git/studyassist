// Mock API Handler for 1-4-7 Study Assist
// Transparently handles API operations when the Express backend is not reachable.

import { loadStore, saveStore, initializeMockStore } from './mockData';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body as string) : {};
  const store = loadStore();
  const today = getTodayStr();

  // 1. Auth routes
  if (endpoint.startsWith('/auth/login')) {
    const user = store.user;
    return {
      token: 'mock_jwt_token_demo_147',
      user,
      settings: store.settings
    } as T;
  }

  if (endpoint.startsWith('/auth/register')) {
    const newUser = {
      id: `user_${Date.now()}`,
      name: body.name || 'New Student',
      email: body.email,
      timezone: body.timezone || 'Asia/Kolkata'
    };
    store.user = newUser;
    saveStore(store);
    return {
      token: 'mock_jwt_token_new_user',
      user: newUser
    } as T;
  }

  if (endpoint.startsWith('/auth/me')) {
    return {
      user: store.user,
      settings: store.settings,
      streak: store.streak
    } as T;
  }

  if (endpoint.startsWith('/auth/reset-demo')) {
    const fresh = initializeMockStore();
    saveStore(fresh);
    return {
      success: true,
      message: 'Demo dataset reset to initial state'
    } as T;
  }

  // 2. Subjects routes
  if (endpoint === '/subjects' && method === 'GET') {
    const result = store.subjects.map((s) => {
      const units = store.units[s.id] || [];
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
      user_id: store.user.id,
      name: body.name,
      description: body.description || '',
      color: body.color || '#6366F1',
      is_archived: 0,
      created_at: new Date().toISOString()
    };
    store.subjects.push(newSubject);
    store.units[newSubject.id] = [];
    saveStore(store);
    return newSubject as T;
  }

  if (endpoint.match(/^\/subjects\/[^/]+$/) && method === 'PUT') {
    const id = endpoint.split('/')[2];
    const s = store.subjects.find((sub) => sub.id === id);
    if (s) {
      Object.assign(s, body);
      saveStore(store);
      return s as T;
    }
  }

  if (endpoint.match(/^\/subjects\/[^/]+$/) && method === 'DELETE') {
    const id = endpoint.split('/')[2];
    store.subjects = store.subjects.filter((s) => s.id !== id);
    delete store.units[id];
    saveStore(store);
    return { success: true } as T;
  }

  // 3. Units routes
  if (endpoint.match(/^\/subjects\/[^/]+\/units$/) && method === 'GET') {
    const subjectId = endpoint.split('/')[2];
    const units = store.units[subjectId] || [];
    const withRevs = units.map((u) => ({
      ...u,
      revisions: store.revisions.filter((r) => r.unit_id === u.id)
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
    if (!store.units[subjectId]) store.units[subjectId] = [];
    store.units[subjectId].push(newUnit);
    saveStore(store);
    return newUnit as T;
  }

  if (endpoint.match(/^\/units\/[^/]+$/) && method === 'DELETE') {
    const unitId = endpoint.split('/')[2];
    for (const subId in store.units) {
      store.units[subId] = store.units[subId].filter((u) => u.id !== unitId);
    }
    store.revisions = store.revisions.filter((r) => r.unit_id !== unitId);
    saveStore(store);
    return { success: true } as T;
  }

  // 4. Study routes (Day 1 start & complete)
  if (endpoint === '/study/start') {
    return {
      unitId: body.unitId,
      startedAt: new Date().toISOString(),
      estimatedMinutes: 60,
      status: 'Studying'
    } as T;
  }

  if (endpoint === '/study/complete') {
    const { unitId, subjectId, durationMinutes, notes, checklist } = body;
    const studyDate = body.studyDate || today;
    const day4 = addDays(studyDate, 3);
    const day7 = addDays(studyDate, 6);

    // Update unit status
    for (const sId in store.units) {
      const u = store.units[sId].find((unit) => unit.id === unitId);
      if (u) {
        u.status = 'Revision Scheduled';
      }
    }

    const sub = store.subjects.find((s) => s.id === subjectId);
    const unitList = store.units[subjectId] || [];
    const targetUnit = unitList.find((u) => u.id === unitId);

    // Create 1-4-7 Revisions
    const rev1 = {
      id: `rev_${Date.now()}_1`,
      user_id: store.user.id,
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
      user_id: store.user.id,
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

    store.revisions.push(rev1, rev2);

    if (notes) {
      if (!store.notes[unitId]) store.notes[unitId] = { unitId, notes: '', questions: [] };
      store.notes[unitId].notes = notes;
    }

    store.history.unshift({
      id: `hist_${Date.now()}`,
      user_id: store.user.id,
      activity_type: 'study_completed',
      title: 'Day 1 Study Completed',
      description: `Completed study session for ${targetUnit?.name || 'Unit'}`,
      timestamp: studyDate,
      duration_minutes: durationMinutes || 60
    });

    // Update streak
    store.streak.current_streak += 1;
    if (store.streak.current_streak > store.streak.longest_streak) {
      store.streak.longest_streak = store.streak.current_streak;
    }

    saveStore(store);

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

  // 5. Revisions routes
  if (endpoint.startsWith('/revisions/today')) {
    const list = store.revisions.filter((r) => r.scheduled_date === today && r.status === 'Scheduled');
    return list as T;
  }

  if (endpoint.startsWith('/revisions/overdue')) {
    const list = store.revisions.filter(
      (r) => r.scheduled_date < today && r.status === 'Scheduled'
    ).map((r) => ({
      ...r,
      days_overdue: Math.max(1, Math.floor((new Date(today).getTime() - new Date(r.scheduled_date).getTime()) / 86400000))
    }));
    return list as T;
  }

  if (endpoint.startsWith('/revisions/upcoming')) {
    const list = store.revisions.filter((r) => r.scheduled_date >= today && r.status === 'Scheduled');
    return list as T;
  }

  if (endpoint.match(/^\/revisions\/[^/]+$/) && method === 'GET') {
    const id = endpoint.split('/')[2];
    const rev = store.revisions.find((r) => r.id === id);
    return rev as T;
  }

  if (endpoint.match(/^\/revisions\/[^/]+\/complete$/) && method === 'POST') {
    const id = endpoint.split('/')[2].replace('/complete', '');
    const rev = store.revisions.find((r) => r.id === id);
    let isMastered = false;

    if (rev) {
      rev.status = 'Completed';
      rev.performance = body.performance || 'Good';
      rev.completion_date = today;

      // Find unit
      for (const sId in store.units) {
        const u = store.units[sId].find((unit) => unit.id === rev.unit_id);
        if (u) {
          if (rev.revision_number === 1) {
            u.status = 'Revision 1 Completed';
          } else if (rev.revision_number === 2) {
            u.status = 'Mastered';
            isMastered = true;
          }
        }
      }

      store.streak.current_streak += 1;
      saveStore(store);

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

  // 6. Dashboard
  if (endpoint.startsWith('/dashboard')) {
    const overdue = store.revisions.filter((r) => r.scheduled_date < today && r.status === 'Scheduled').map((r) => ({
      ...r,
      days_overdue: Math.max(1, Math.floor((new Date(today).getTime() - new Date(r.scheduled_date).getTime()) / 86400000))
    }));
    const todayRevs = store.revisions.filter((r) => r.scheduled_date === today && r.status === 'Scheduled');

    let totalUnits = 0;
    let masteredUnits = 0;
    for (const sId in store.units) {
      const uList = store.units[sId];
      totalUnits += uList.length;
      masteredUnits += uList.filter((u) => u.status === 'Mastered').length;
    }

    const todayTasks = [
      ...todayRevs.map((r) => ({
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
      }))
    ];

    return {
      todayDate: today,
      metrics: {
        newStudyCount: 1,
        day4Count: todayRevs.filter((r) => r.revision_number === 1).length,
        day7Count: todayRevs.filter((r) => r.revision_number === 2).length,
        overdueRevisions: overdue.length,
        masteredUnits,
        totalStudyMinutes: 340
      },
      today: {
        newStudyCount: 1,
        day4Count: todayRevs.filter((r) => r.revision_number === 1).length,
        day7Count: todayRevs.filter((r) => r.revision_number === 2).length,
        totalTasksCount: todayTasks.length,
        tasks: todayTasks
      },
      overdueRevisions: overdue,
      upcomingRevisions: store.revisions.filter((r) => r.scheduled_date > today && r.status === 'Scheduled'),
      streak: store.streak,
      subjectProgress: store.subjects.map((s) => {
        const u = store.units[s.id] || [];
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

  // 7. Calendar
  if (endpoint.startsWith('/calendar')) {
    const map: Record<string, any[]> = {};
    store.revisions.forEach((r) => {
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

  // 8. Notes
  if (endpoint.match(/^\/notes\/[^/]+$/) && method === 'GET') {
    const unitId = endpoint.split('/')[2];
    return (store.notes[unitId] || { unitId, notes: '', questions: [] }) as T;
  }

  if (endpoint.match(/^\/notes\/[^/]+$/) && method === 'POST') {
    const unitId = endpoint.split('/')[2];
    if (!store.notes[unitId]) store.notes[unitId] = { unitId, notes: '', questions: [] };
    store.notes[unitId].notes = body.notes;
    saveStore(store);
    return { success: true } as T;
  }

  if (endpoint.match(/^\/notes\/[^/]+\/questions$/) && method === 'POST') {
    const unitId = endpoint.split('/')[2];
    if (!store.notes[unitId]) store.notes[unitId] = { unitId, notes: '', questions: [] };
    const newQ = {
      id: `q_${Date.now()}`,
      type: body.type || 'short',
      text: body.text,
      marks: body.marks || 5,
      user_answer: ''
    };
    store.notes[unitId].questions.push(newQ);
    saveStore(store);
    return newQ as T;
  }

  // 9. Exams
  if (endpoint === '/exams' && method === 'GET') {
    return store.exams as T;
  }

  if (endpoint === '/exams' && method === 'POST') {
    const sub = store.subjects.find((s) => s.id === body.subject_id);
    const newExam = {
      id: `exam_${Date.now()}`,
      user_id: store.user.id,
      subject_id: body.subject_id,
      subject_name: sub?.name || 'Subject',
      exam_name: body.exam_name,
      exam_date: body.exam_date,
      target_score: body.target_score || 90,
      notes: body.notes || ''
    };
    store.exams.push(newExam);
    saveStore(store);
    return newExam as T;
  }

  // 10. AI Tutor endpoints
  if (endpoint.startsWith('/ai/')) {
    if (endpoint.includes('generate-questions')) {
      return [
        {
          id: `ai_q_${Date.now()}_1`,
          type: 'short',
          text: `Explain the fundamental assumptions and key policy implications of ${body.topic || 'this unit'}.`,
          marks: 5,
          sample_answer: 'Sample answer detailing core conceptual definitions and policy relevance.'
        },
        {
          id: `ai_q_${Date.now()}_2`,
          type: 'long',
          text: `Critically evaluate ${body.topic || 'the topic'} in terms of real-world implementation challenges and economic outcomes.`,
          marks: 10,
          sample_answer: 'Comprehensive multi-paragraph synthesis analyzing trade-offs and structural implications.'
        }
      ] as T;
    }

    return {
      response: `### AI Tutor Explanation: ${body.topic || 'Subject Topic'}

1. **Core Intuition**: Spaced repetition locks this concept into long-term synaptic memory.
2. **Key Theoretical Mechanism**: Reviewing on **Day 4** arrests the exponential forgetting curve before retention drops below 20%.
3. **Exam Tip**: In 10-mark university questions, always include a diagram or schematic framework to secure full credit.`
    } as T;
  }

  // 11. Notifications
  if (endpoint === '/notifications') {
    return store.notifications as T;
  }

  if (endpoint === '/history') {
    return store.history as T;
  }

  if (endpoint === '/settings') {
    return store.settings as T;
  }

  return {} as T;
}
