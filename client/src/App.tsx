import React, { useState, useEffect } from 'react';
import { api, getStoredToken, clearStoredToken } from './api/client';
import { User, UserSettings, Streak, Subject, Unit } from './types';
import { Navbar } from './components/Navbar';
import { MobileDock } from './components/MobileDock';
import { LandingAuth } from './pages/LandingAuth';
import { DashboardView } from './pages/DashboardView';
import { SubjectsView } from './pages/SubjectsView';
import { CalendarView } from './pages/CalendarView';
import { HistoryView } from './pages/HistoryView';
import { NotesView } from './pages/NotesView';
import { ExamModeView } from './pages/ExamModeView';
import { SettingsView } from './pages/SettingsView';
import { StudySessionModal } from './components/StudySessionModal';
import { RevisionSessionModal } from './components/RevisionSessionModal';
import { SubjectModal } from './components/SubjectModal';
import { UnitModal } from './components/UnitModal';
import { ExamModal } from './components/ExamModal';
import { AIModal } from './components/AIModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OnboardingModal } from './components/OnboardingModal';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingApp, setLoadingApp] = useState(true);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('studyassist_theme') !== 'light';
  });

  // Data states
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Modals state
  const [studyModalData, setStudyModalData] = useState<{ unit: Unit; subject: Subject } | null>(null);
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [addUnitSubject, setAddUnitSubject] = useState<Subject | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiSelectedUnitId, setAiSelectedUnitId] = useState<string | undefined>(undefined);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [notesTargetUnitId, setNotesTargetUnitId] = useState<string | undefined>(undefined);

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('studyassist_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('studyassist_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Check login on startup
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoadingApp(false);
      return;
    }

    api.auth
      .me()
      .then((data) => {
        setUser(data.user);
        setSettings(data.settings);
        setStreak(data.streak);
      })
      .catch(() => {
        clearStoredToken();
        setUser(null);
      })
      .finally(() => setLoadingApp(false));
  }, []);

  // Fetch Dashboard and Subjects
  const refreshCoreData = async () => {
    if (!user) return;
    try {
      setLoadingDashboard(true);
      const [dash, subjList, notifs] = await Promise.all([
        api.dashboard.get(),
        api.subjects.list(),
        api.notifications.list()
      ]);
      setDashboardData(dash);
      setSubjects(subjList || []);
      setUnreadCount(notifs.unreadCount || 0);

      // Also refresh streak info
      const meData = await api.auth.me().catch(() => null);
      if (meData?.streak) setStreak(meData.streak);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCoreData();
    }
  }, [user]);

  const handleAuthSuccess = (authUser: User, authSettings: UserSettings) => {
    setUser(authUser);
    setSettings(authSettings);
    refreshCoreData();
  };

  const handleLogout = () => {
    clearStoredToken();
    setUser(null);
    setDashboardData(null);
    setSubjects([]);
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset demo data to initial state (Regional Economics with Day 1, Day 4 & Day 7)?')) {
      await api.auth.resetDemo();
      refreshCoreData();
      alert('Demo data re-seeded successfully!');
    }
  };

  const handleQuickStudy = () => {
    // If we have subjects and units, pick first uncompleted or studying unit
    if (subjects.length > 0) {
      setActiveTab('subjects');
    } else {
      setIsSubjectModalOpen(true);
    }
  };

  if (loadingApp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full" />
          <p className="font-display font-medium text-sm text-slate-300">
            Initializing 1-4-7 Smart Study Guide...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingAuth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white pb-20 lg:pb-8">
      {/* Top Navbar */}
      <Navbar
        user={user}
        streak={streak}
        unreadCount={unreadCount}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'ai') {
            setIsAIModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        onLogout={handleLogout}
        onResetDemo={handleResetDemo}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onQuickStudy={handleQuickStudy}
        onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            dashboardData={dashboardData}
            loading={loadingDashboard}
            onStartStudy={(unit, subject) => setStudyModalData({ unit, subject })}
            onStartRevision={(revId) => setActiveRevisionId(revId)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            subjects={subjects}
            user={user}
            onOpenOnboarding={() => setIsOnboardingModalOpen(true)}
          />
        )}

        {activeTab === 'subjects' && (
          <SubjectsView
            subjects={subjects}
            onRefreshSubjects={refreshCoreData}
            onOpenCreateSubject={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            onEditSubject={(subject) => {
              setEditingSubject(subject);
              setIsSubjectModalOpen(true);
            }}
            onOpenAddUnit={(subject) => {
              setAddUnitSubject(subject);
              setEditingUnit(null);
              setIsUnitModalOpen(true);
            }}
            onEditUnit={(subject, unit) => {
              setAddUnitSubject(subject);
              setEditingUnit(unit);
              setIsUnitModalOpen(true);
            }}
            onStartStudy={(unit, subject) => setStudyModalData({ unit, subject })}
            onStartRevision={(revId) => setActiveRevisionId(revId)}
            onOpenNotes={(unitId) => {
              setNotesTargetUnitId(unitId);
              setActiveTab('notes');
            }}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            onStartRevision={(revId) => setActiveRevisionId(revId)}
            onOpenUnit={(unitId) => {
              setNotesTargetUnitId(unitId);
              setActiveTab('notes');
            }}
          />
        )}

        {activeTab === 'history' && <HistoryView subjects={subjects} />}

        {activeTab === 'notes' && (
          <NotesView
            subjects={subjects}
            initialUnitId={notesTargetUnitId}
            onOpenAI={(unitId) => {
              setAiSelectedUnitId(unitId);
              setIsAIModalOpen(true);
            }}
          />
        )}

        {activeTab === 'exam' && (
          <ExamModeView
            subjects={subjects}
            onOpenCreateExam={() => setIsExamModalOpen(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            user={user}
            settings={settings}
            onRefreshSettings={refreshCoreData}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Mobile Bottom Dock (Requirement 25) */}
      <MobileDock
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'ai') {
            setIsAIModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
      />

      {/* Study Session Modal (Day 1) */}
      {studyModalData && (
        <StudySessionModal
          unit={studyModalData.unit}
          subject={studyModalData.subject}
          isOpen={!!studyModalData}
          onClose={() => setStudyModalData(null)}
          onCompleted={() => {
            refreshCoreData();
          }}
        />
      )}

      {/* Revision Session Modal (Day 4 & Day 7) */}
      {activeRevisionId && (
        <RevisionSessionModal
          revisionId={activeRevisionId}
          isOpen={!!activeRevisionId}
          onClose={() => setActiveRevisionId(null)}
          onCompleted={() => {
            refreshCoreData();
          }}
        />
      )}

      {/* Subject Modal */}
      <SubjectModal
        subject={editingSubject}
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onSaved={refreshCoreData}
      />

      {/* Unit Modal */}
      {addUnitSubject && (
        <UnitModal
          subjectId={addUnitSubject.id}
          subjectName={addUnitSubject.name}
          unit={editingUnit}
          isOpen={isUnitModalOpen}
          onClose={() => {
            setIsUnitModalOpen(false);
            setAddUnitSubject(null);
            setEditingUnit(null);
          }}
          onSaved={refreshCoreData}
        />
      )}

      {/* Exam Plan Modal */}
      <ExamModal
        subjects={subjects}
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        onSaved={refreshCoreData}
      />

      {/* AI Tutor & Question Generator Modal */}
      <AIModal
        subjects={subjects}
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAiSelectedUnitId(undefined);
        }}
        selectedUnitId={aiSelectedUnitId}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => {
          setIsNotificationDrawerOpen(false);
          refreshCoreData();
        }}
        onSelectRevision={(revId) => {
          setActiveRevisionId(revId);
        }}
      />

      {/* Newcomer Onboarding & Personal Database Setup Modal */}
      {user && (!user.onboarding_completed || isOnboardingModalOpen) && (
        <OnboardingModal
          user={user}
          onComplete={(updatedUser, updatedSettings) => {
            setUser(updatedUser);
            setSettings(updatedSettings);
            setIsOnboardingModalOpen(false);
            refreshCoreData();
          }}
        />
      )}
    </div>
  );
}

export default App;
