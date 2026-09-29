// Client-side Mock Data & Engine for 1-4-7 Study Assist
// Ensures the app works seamlessly even on static hosts (like Vercel) or when backend is offline.

export interface MockStore {
  user: any;
  settings: any;
  streak: any;
  subjects: any[];
  units: Record<string, any[]>;
  revisions: any[];
  notes: Record<string, any>;
  exams: any[];
  notifications: any[];
  history: any[];
}

const STORAGE_KEY = 'studyassist_local_db_v2';

function getTodayStr(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function initializeMockStore(): MockStore {
  const today = getTodayStr();
  const day1Date = addDays(today, -3); // Started 3 days ago so Day 4 is today!
  const overdueDate = addDays(today, -5); // Scheduled 5 days ago, overdue!

  return {
    user: {
      id: 'user_demo_147',
      name: 'Alex Morgan',
      email: 'demo@studyassist.com',
      timezone: 'Asia/Kolkata'
    },
    settings: {
      id: 'settings_demo',
      user_id: 'user_demo_147',
      timezone: 'Asia/Kolkata',
      reminder_time: '19:00',
      browser_notifications_enabled: 1,
      email_notifications_enabled: 1,
      daily_digest_enabled: 1
    },
    streak: {
      id: 'streak_demo',
      user_id: 'user_demo_147',
      current_streak: 5,
      longest_streak: 12,
      last_activity_date: today
    },
    subjects: [
      {
        id: 'subj_reg_econ',
        user_id: 'user_demo_147',
        name: 'Regional Economics',
        description: 'University postgraduate syllabus on regional growth theories, spatial planning models, and economic development.',
        color: '#6366F1',
        is_archived: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'subj_micro_econ',
        user_id: 'user_demo_147',
        name: 'Micro Economics',
        description: 'Advanced consumer choice, general equilibrium, game theory, and market failure analysis.',
        color: '#0EA5E9',
        is_archived: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'subj_data_struct',
        user_id: 'user_demo_147',
        name: 'Data Structures & Algorithms',
        description: 'Core computer science syllabus: Trees, Graphs, Dynamic Programming, and Spaced Problem Solving.',
        color: '#EC4899',
        is_archived: 0,
        created_at: new Date().toISOString()
      }
    ],
    units: {
      subj_reg_econ: [
        {
          id: 'unit_reg_1',
          subject_id: 'subj_reg_econ',
          unit_number: 'Unit I',
          name: 'Introduction to Regional Economics',
          description: 'Administrative regions, planning regions, agro-climatic regions and functional spatial economics.',
          difficulty: 'Medium',
          estimated_minutes: 60,
          status: 'Revision Scheduled',
          created_at: new Date().toISOString()
        },
        {
          id: 'unit_reg_2',
          subject_id: 'subj_reg_econ',
          unit_number: 'Unit II',
          name: 'Approaches to Regional Growth',
          description: 'Export base theory, neoclassical growth models, cumulative causation, and core-periphery dynamics.',
          difficulty: 'Hard',
          estimated_minutes: 75,
          status: 'Revision Scheduled',
          created_at: new Date().toISOString()
        },
        {
          id: 'unit_reg_3',
          subject_id: 'subj_reg_econ',
          unit_number: 'Unit III',
          name: 'Regional Development Theories',
          description: 'Growth pole theory of Perroux, Hirschman backward and forward linkages, Myrdal spread and backwash effects.',
          difficulty: 'Medium',
          estimated_minutes: 60,
          status: 'Not Started',
          created_at: new Date().toISOString()
        },
        {
          id: 'unit_reg_4',
          subject_id: 'subj_reg_econ',
          unit_number: 'Unit IV',
          name: 'Regional Planning Framework',
          description: 'Multi-level planning framework, decentralized district planning, and resource allocation models.',
          difficulty: 'Easy',
          estimated_minutes: 45,
          status: 'Not Started',
          created_at: new Date().toISOString()
        }
      ],
      subj_micro_econ: [
        {
          id: 'unit_micro_1',
          subject_id: 'subj_micro_econ',
          unit_number: 'Unit I',
          name: 'Consumer Choice & Utility Maximization',
          description: 'Indifference curve analysis, Slutsky substitution and income effects, Revealed preference theory.',
          difficulty: 'Medium',
          estimated_minutes: 50,
          status: 'Mastered',
          created_at: new Date().toISOString()
        },
        {
          id: 'unit_micro_2',
          subject_id: 'subj_micro_econ',
          unit_number: 'Unit II',
          name: 'Theory of Production & Costs',
          description: 'Cobb-Douglas production function, CES returns to scale, short-run vs long-run envelope curves.',
          difficulty: 'Hard',
          estimated_minutes: 65,
          status: 'Not Started',
          created_at: new Date().toISOString()
        }
      ],
      subj_data_struct: [
        {
          id: 'unit_dsa_1',
          subject_id: 'subj_data_struct',
          unit_number: 'Module 1',
          name: 'Binary Search Trees & AVL Balancing',
          description: 'Tree rotations, recursive traversals, balance factor calculation, search time complexities.',
          difficulty: 'Medium',
          estimated_minutes: 60,
          status: 'Revision 1 Completed',
          created_at: new Date().toISOString()
        },
        {
          id: 'unit_dsa_2',
          subject_id: 'subj_data_struct',
          unit_number: 'Module 2',
          name: 'Dynamic Programming Patterns',
          description: 'Memoization, tabulation, knapsack subproblems, and longest common subsequence derivations.',
          difficulty: 'Hard',
          estimated_minutes: 90,
          status: 'Not Started',
          created_at: new Date().toISOString()
        }
      ]
    },
    revisions: [
      {
        id: 'rev_reg_1_day4',
        user_id: 'user_demo_147',
        unit_id: 'unit_reg_1',
        revision_number: 1,
        stage_title: 'Revise #1 (Day 4)',
        scheduled_date: today,
        status: 'Scheduled',
        subject_name: 'Regional Economics',
        subject_color: '#6366F1',
        unit_name: 'Introduction to Regional Economics',
        unit_number: 'Unit I',
        estimated_minutes: 25,
        created_at: new Date().toISOString()
      },
      {
        id: 'rev_reg_2_day4',
        user_id: 'user_demo_147',
        unit_id: 'unit_reg_2',
        revision_number: 1,
        stage_title: 'Revise #1 (Day 4)',
        scheduled_date: overdueDate,
        status: 'Scheduled',
        subject_name: 'Regional Economics',
        subject_color: '#6366F1',
        unit_name: 'Approaches to Regional Growth',
        unit_number: 'Unit II',
        estimated_minutes: 30,
        days_overdue: 2,
        created_at: new Date().toISOString()
      },
      {
        id: 'rev_dsa_1_day7',
        user_id: 'user_demo_147',
        unit_id: 'unit_dsa_1',
        revision_number: 2,
        stage_title: 'Revise #2 (Day 7)',
        scheduled_date: today,
        status: 'Scheduled',
        subject_name: 'Data Structures & Algorithms',
        subject_color: '#EC4899',
        unit_name: 'Binary Search Trees & AVL Balancing',
        unit_number: 'Module 1',
        estimated_minutes: 35,
        created_at: new Date().toISOString()
      }
    ],
    notes: {
      unit_reg_1: {
        unitId: 'unit_reg_1',
        notes: `### Regional Economics — Key Summary

- **Region Definition**: A geographical area possessing common characteristics or economic linkages.
- **Typologies**:
  1. *Homogeneous Region*: Uniformity in demographic, physical or income parameters.
  2. *Polarized/Functional Region*: Heterogeneous components linked by economic flows to a dominant central node.
  3. *Planning Region*: Administrative boundaries designated for resource allocation and state development policies.

> **Key Exam Question**: Differentiate between polarized nodal regions and homogeneous physical regions with examples.`,
        questions: [
          {
            id: 'q_1',
            type: 'short',
            text: 'Define a planning region and explain why administrative boundaries frequently mismatch functional economic regions.',
            marks: 5,
            user_answer: ''
          },
          {
            id: 'q_2',
            type: 'long',
            text: 'Analyze the criteria for delineating agricultural planning regions in developing nations.',
            marks: 10,
            user_answer: ''
          }
        ]
      }
    },
    exams: [
      {
        id: 'exam_1',
        user_id: 'user_demo_147',
        subject_id: 'subj_reg_econ',
        subject_name: 'Regional Economics',
        exam_name: 'End-Semester Final Examination',
        exam_date: addDays(today, 21),
        target_score: 95,
        notes: 'Covers Units I to IV. Focus on Perroux growth poles and multi-level planning.'
      }
    ],
    notifications: [
      {
        id: 'notif_1',
        user_id: 'user_demo_147',
        title: 'Revise #1 Due Today!',
        message: 'Unit I: Introduction to Regional Economics is ready for your Day 4 recall session.',
        type: 'revision_due',
        revision_id: 'rev_reg_1_day4',
        is_read: 0,
        created_at: new Date().toISOString()
      },
      {
        id: 'notif_2',
        user_id: 'user_demo_147',
        title: 'Mastery Revision #2 Ready!',
        message: 'Module 1: Binary Search Trees is due for final Day 7 mastery!',
        type: 'revision_due',
        revision_id: 'rev_dsa_1_day7',
        is_read: 0,
        created_at: new Date().toISOString()
      }
    ],
    history: [
      {
        id: 'hist_1',
        user_id: 'user_demo_147',
        activity_type: 'study_completed',
        title: 'Day 1 Study Completed',
        description: 'Completed initial study for Unit I: Introduction to Regional Economics',
        timestamp: day1Date,
        duration_minutes: 55
      }
    ]
  };
}

export function loadStore(): MockStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load local store, initializing fresh', e);
  }
  const fresh = initializeMockStore();
  saveStore(fresh);
  return fresh;
}

export function saveStore(store: MockStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save store', e);
  }
}
