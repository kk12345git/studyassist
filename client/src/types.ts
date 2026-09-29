export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type UnitStatus =
  | 'Not Started'
  | 'Studying'
  | 'Revision Scheduled'
  | 'Revision 1 Completed'
  | 'Revision 2 Completed'
  | 'Mastered';

export type PerformanceRating = 'Difficult' | 'Average' | 'Good' | 'Excellent';

export interface User {
  id: string;
  name: string;
  email: string;
  timezone: string;
  university?: string;
  degree?: string;
  academic_year?: string;
  target_study_hours?: number;
  study_goal?: string;
  onboarding_completed?: number | boolean;
}

export interface UserSettings {
  id: string;
  user_id: string;
  timezone: string;
  reminder_time: string;
  browser_notifications_enabled: number;
  email_notifications_enabled: number;
  daily_digest_enabled: number;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  is_archived: number;
  created_at: string;
  stats?: {
    totalUnits: number;
    studiedUnits: number;
    masteredUnits: number;
    pendingUnits: number;
    revision1Units: number;
    revisionScheduledUnits: number;
    notStartedUnits: number;
    totalRevisions: number;
    completedRevisions: number;
    overallProgressPct: number;
  };
}

export interface Unit {
  id: string;
  subject_id: string;
  user_id: string;
  unit_number: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  estimated_minutes: number;
  status: UnitStatus;
  created_at: string;
  studySession?: any;
  revisions?: RevisionSession[];
  hasNotes?: boolean;
}

export interface RevisionSession {
  id: string;
  user_id: string;
  subject_id: string;
  unit_id: string;
  study_session_id: string;
  revision_number: 1 | 2;
  stage_title: string;
  scheduled_date: string; // YYYY-MM-DD
  completed_at: string | null;
  status: 'Pending' | 'Completed' | 'Overdue';
  duration_minutes: number;
  performance: PerformanceRating | null;
  days_late: number;
  feedback_notes?: string;
  unit_name?: string;
  unit_number?: string;
  subject_name?: string;
  subject_color?: string;
  original_study_date?: string;
  current_days_late?: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string;
  unit_id: string;
  started_at: string;
  completed_at: string;
  study_date: string;
  duration_minutes: number;
  status: string;
  notes: string;
  checklist: Array<{ id: string; text: string; done: boolean }>;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  revision_session_id: string;
  notification_type: string;
  title: string;
  message: string;
  scheduled_date: string;
  scheduled_time: string;
  is_read: number;
  created_at: string;
  subject_name?: string;
  unit_name?: string;
}

export interface ExamPlan {
  id: string;
  subject_id: string;
  subject_name?: string;
  subject_color?: string;
  exam_name: string;
  exam_date: string;
  target_score: string;
  notes: string;
  daysRemaining: number;
  isPast: boolean;
  totalUnits: number;
  completedUnits: number;
  remainingUnits: number;
  revisionsRemaining: number;
  progressPercent: number;
}

export interface UnitNotes {
  id: string;
  unit_id: string;
  content: string;
  important_points: string[];
  key_terms: Array<{ term: string; definition: string }>;
  questions_2m: string[];
  questions_5m: string[];
  questions_10m: string[];
  updated_at: string;
}
