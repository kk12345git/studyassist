import React, { useState } from 'react';
import {
  Brain,
  Flame,
  Bell,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Target,
  LayoutDashboard
} from 'lucide-react';
import { User, Streak } from '../types';

interface NavbarProps {
  user: User | null;
  streak: Streak | null;
  unreadCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onResetDemo: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  onQuickStudy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  streak,
  unreadCount,
  activeTab,
  setActiveTab,
  onOpenNotifications,
  onLogout,
  onResetDemo,
  isDark,
  toggleTheme,
  onQuickStudy
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'notes', label: 'Notes & Qs', icon: FileText },
    { id: 'exam', label: 'Exam Mode', icon: Target },
    { id: 'ai', label: 'AI Tutor', icon: Sparkles }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 text-left transition hover:opacity-90"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 shadow-md shadow-indigo-500/25 ring-1 ring-white/15 shrink-0">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                  1-4-7
                </span>
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                  Rule
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 hidden xs:block">Smart Study Guide</p>
            </div>
          </button>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 ml-6 border-l border-white/10 pl-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Study Button */}
          <button
            onClick={onQuickStudy}
            className="btn btn-primary btn-sm hidden sm:inline-flex items-center gap-1.5 shadow-indigo-500/20 text-xs font-bold py-1.5 px-3"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Study Now</span>
          </button>

          {/* Study Streak Badge */}
          {streak && (
            <div
              className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 sm:px-2.5 py-1 text-xs font-semibold text-amber-300"
              title={`Current streak: ${streak.current_streak} days. Longest: ${streak.longest_streak} days.`}
            >
              <Flame className="h-3.5 w-3.5 text-amber-400 animate-flame" />
              <span>{streak.current_streak}d</span>
            </div>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-800/60 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title="Revision Reminders & Notifications"
          >
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-800/60 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-400" />}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-white/10 bg-slate-800/60 p-1 sm:p-1.5 sm:pr-2.5 transition hover:bg-slate-800"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline-block text-xs font-medium text-slate-300 max-w-[90px] truncate">
                  {user.name}
                </span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl z-40 text-xs">
                    <div className="border-b border-white/10 px-3 py-2">
                      <p className="font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-slate-300 hover:bg-white/5"
                    >
                      <span>Settings & Reminders</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onResetDemo();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-amber-300 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Demo Data</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
