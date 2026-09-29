// API Client for 1-4-7 Smart Study Guide
import { handleMockRequest } from './mockHandler';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('studyassist_token');
}

export function setStoredToken(token: string) {
  localStorage.setItem('studyassist_token', token);
}

export function clearStoredToken() {
  localStorage.removeItem('studyassist_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.ok) {
      return response.json();
    }

    // If backend returns 404 (e.g. static hosting on Vercel without Express running), fallback to local mock engine
    if (response.status === 404 || response.status === 502 || response.status === 503) {
      return await handleMockRequest<T>(endpoint, options);
    }

    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  } catch (err: any) {
    // If network error, offline, or failed to fetch, seamlessly fallback to local engine
    console.info(`API request to ${endpoint} failed (${err.message}), falling back to local study engine`);
    return await handleMockRequest<T>(endpoint, options);
  }
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ token: string; user: any; settings: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),
    register: (data: { name: string; email: string; password: string; timezone?: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    me: () => request<{ user: any; settings: any; streak: any }>('/auth/me'),
    resetDemo: () => request<{ success: boolean; message: string }>('/auth/reset-demo', { method: 'POST' })
  },

  subjects: {
    list: () => request<any[]>('/subjects'),
    create: (data: { name: string; description?: string; color?: string }) =>
      request<any>('/subjects', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: { name: string; description?: string; color?: string }) =>
      request<any>(`/subjects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    toggleArchive: (id: string) =>
      request<{ id: string; is_archived: number }>(`/subjects/${id}/archive`, {
        method: 'PATCH'
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/subjects/${id}`, {
        method: 'DELETE'
      })
  },

  units: {
    listBySubject: (subjectId: string) => request<any[]>(`/subjects/${subjectId}/units`),
    get: (id: string) => request<any>(`/units/${id}`),
    create: (subjectId: string, data: {
      unit_number: string;
      name: string;
      description?: string;
      difficulty?: string;
      estimated_minutes?: number;
    }) =>
      request<any>(`/subjects/${subjectId}/units`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: any) =>
      request<any>(`/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/units/${id}`, {
        method: 'DELETE'
      })
  },

  study: {
    start: (unitId: string) =>
      request<{ unitId: string; startedAt: string; estimatedMinutes: number; status: string }>('/study/start', {
        method: 'POST',
        body: JSON.stringify({ unitId })
      }),
    complete: (data: {
      unitId: string;
      subjectId: string;
      studyDate?: string;
      durationMinutes: number;
      startedAt?: string;
      completedAt?: string;
      notes?: string;
      checklist?: Array<{ id: string; text: string; done: boolean }>;
    }) =>
      request<{
        success: boolean;
        message: string;
        unitId: string;
        unitStatus: string;
        schedule: any;
        revisions: any[];
      }>('/study/complete', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  revisions: {
    getToday: (date?: string) => request<any[]>(`/revisions/today${date ? `?date=${date}` : ''}`),
    getOverdue: (date?: string) => request<any[]>(`/revisions/overdue${date ? `?date=${date}` : ''}`),
    getUpcoming: (date?: string, days: number = 14) =>
      request<any[]>(`/revisions/upcoming?days=${days}${date ? `&date=${date}` : ''}`),
    getDetails: (id: string) => request<any>(`/revisions/${id}`),
    complete: (id: string, data: {
      performance: 'Difficult' | 'Average' | 'Good' | 'Excellent';
      durationMinutes: number;
      completionDate?: string;
      feedbackNotes?: string;
    }) =>
      request<{
        success: boolean;
        message: string;
        revisionId: string;
        revisionNumber: number;
        unitId: string;
        unitStatus: string;
        isMastered: boolean;
        daysLate: number;
      }>(`/revisions/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  dashboard: {
    get: (date?: string) => request<any>(`/dashboard${date ? `?date=${date}` : ''}`)
  },

  calendar: {
    getEvents: () => request<{ events: any[]; byDate: Record<string, any[]> }>('/calendar')
  },

  history: {
    list: (subjectId?: string, type?: string) => {
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (type) params.append('type', type);
      return request<any[]>(`/history?${params.toString()}`);
    }
  },

  notes: {
    get: (unitId: string) => request<any>(`/notes/${unitId}`),
    save: (unitId: string, data: {
      content?: string;
      important_points?: string[];
      key_terms?: Array<{ term: string; definition: string }>;
      questions_2m?: string[];
      questions_5m?: string[];
      questions_10m?: string[];
    }) =>
      request<{ success: boolean; message: string; updated_at: string }>(`/notes/${unitId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  exam: {
    list: () => request<any[]>('/exam-plans'),
    create: (data: { subject_id: string; exam_name: string; exam_date: string; target_score?: string; notes?: string }) =>
      request<{ id: string; message: string }>('/exam-plans', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    delete: (id: string) => request<{ success: boolean }>(`/exam-plans/${id}`, { method: 'DELETE' })
  },

  notifications: {
    list: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'POST' })
  },

  settings: {
    get: () => request<any>('/settings'),
    update: (data: any) => request<{ success: boolean; settings: any }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  ai: {
    generateQuestions: (unitId: string) => request<{ success: boolean; data: any }>('/ai/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ unitId })
    }),
    getWeakTopics: () => request<{ totalWeakTopics: number; topics: any[] }>('/ai/weak-topics'),
    generateSummary: (unitId: string) => request<any>('/ai/generate-summary', {
      method: 'POST',
      body: JSON.stringify({ unitId })
    })
  }
};
