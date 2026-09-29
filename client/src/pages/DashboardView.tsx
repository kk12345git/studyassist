import React from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Flame,
  Trophy,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { Subject, Unit } from '../types';

interface DashboardViewProps {
  dashboardData: any;
  loading: boolean;
  onStartStudy: (unit: Unit, subject: Subject) => void;
  onStartRevision: (revisionId: string) => void;
  onNavigateTab: (tab: string) => void;
  subjects: Subject[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  dashboardData,
  loading,
  onStartStudy,
  onStartRevision,
  onNavigateTab,
  subjects
}) => {
  if (loading || !dashboardData) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm font-medium">Loading your 1-4-7 study roadmap...</p>
      </div>
    );
  }

  const { metrics, today, overdueRevisions, upcomingRevisions, subjectProgress, streak, recentActivity } =
    dashboardData;

  const totalStudyHours = Math.floor((metrics?.totalStudyMinutes || 0) / 60);
  const remainingStudyMins = (metrics?.totalStudyMinutes || 0) % 60;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner & Streak */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/40 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>Today: {dashboardData.todayDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              1-4-7 Spaced Revision Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Learn on Day 1, lock in memory on Day 4 (+3 days), and achieve mastery on Day 7 (+6 days).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 border border-white/10 p-3.5 px-4 shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="h-6 w-6 animate-flame" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Active Streak
                </div>
                <div className="text-xl font-bold text-white flex items-baseline gap-1">
                  <span>{streak?.current_streak || 0}</span>
                  <span className="text-xs text-slate-400 font-normal">days</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('subjects')}
              className="btn btn-primary text-xs sm:text-sm py-3.5 px-5 hidden sm:inline-flex"
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse Units</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Today's New Study */}
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-blue-400 text-xs font-semibold">
            <span>New Study</span>
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white">{today?.newStudyCount || 0}</div>
          <div className="text-[10px] text-slate-400">Day 1 units</div>
        </div>

        {/* Day 4 Revisions */}
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-purple-400 text-xs font-semibold">
            <span>Revise #1</span>
            <RotateCw className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white">{today?.day4Count || 0}</div>
          <div className="text-[10px] text-slate-400">Day 4 (+3 days)</div>
        </div>

        {/* Day 7 Revisions */}
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-pink-400 text-xs font-semibold">
            <span>Revise #2</span>
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-white">{today?.day7Count || 0}</div>
          <div className="text-[10px] text-slate-400">Day 7 (+6 days)</div>
        </div>

        {/* Overdue */}
        <div className={`glass-panel p-4 space-y-1 ${overdueRevisions?.length > 0 ? 'border-rose-500/40 bg-rose-500/10' : ''}`}>
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Overdue</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-rose-300">{metrics?.overdueRevisions || 0}</div>
          <div className="text-[10px] text-rose-300/80">Needs attention</div>
        </div>

        {/* Mastered Units */}
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Mastered</span>
            <Trophy className="h-4 w-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-300">{metrics?.masteredUnits || 0}</div>
          <div className="text-[10px] text-slate-400">1-4-7 Completed</div>
        </div>

        {/* Overall Study Time */}
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-semibold">
            <span>Study Time</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-xl font-bold text-white">
            {totalStudyHours}h {remainingStudyMins}m
          </div>
          <div className="text-[10px] text-slate-400">Total focus</div>
        </div>
      </div>

      {/* Overdue Revision Callout Banner (Requirement 12) */}
      {overdueRevisions && overdueRevisions.length > 0 && (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Overdue Revisions Detected ({overdueRevisions.length})</span>
                  <span className="badge badge-overdue text-[10px]">Action Required</span>
                </h3>
                <p className="text-xs text-rose-300/80">
                  Late revisions are not discarded. Complete them now to protect your memory trace!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {overdueRevisions.map((rev: any) => (
              <div
                key={rev.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-rose-500/20 hover:border-rose-500/40 transition"
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-overdue text-[10px]">
                      {rev.stage_title}
                    </span>
                    <span className="text-[11px] text-slate-400">{rev.subject_name}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {rev.unit_number}: {rev.unit_name}
                  </div>
                  <div className="text-[11px] text-rose-400 font-medium">
                    Scheduled: {rev.scheduled_date} • <strong>{rev.days_overdue} day{rev.days_overdue !== 1 ? 's' : ''} overdue</strong>
                  </div>
                </div>

                <button
                  onClick={() => onStartRevision(rev.id)}
                  className="btn btn-sm btn-primary shrink-0 bg-rose-600 hover:bg-rose-500 border-none shadow-rose-600/30 text-xs"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Revise Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Today's Tasks + Upcoming Revisions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Today's Study & Tasks (Requirement 10) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Today's Study & Tasks</h2>
            </div>
            <span className="text-xs text-slate-400">
              {today?.totalTasksCount || 0} item{(today?.totalTasksCount || 0) !== 1 ? 's' : ''} queued
            </span>
          </div>

          <div className="space-y-3">
            {today?.tasks && today.tasks.length > 0 ? (
              today.tasks.map((task: any) => {
                const isRevision = task.actionType === 'revise';
                return (
                  <div
                    key={task.id}
                    className="glass-panel p-4 flex items-center justify-between gap-4 transition hover:translate-x-1"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`badge ${
                            task.revisionNumber === 1
                              ? 'badge-day4'
                              : task.revisionNumber === 2
                              ? 'badge-day7'
                              : 'badge-day1'
                          }`}
                        >
                          {task.taskBadge}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {task.subjectName}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white">
                        {task.unitNumber}: {task.unitName}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>~{task.estimatedMinutes} mins</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-300 font-medium">{task.type}</span>
                      </div>
                    </div>

                    <div>
                      {isRevision ? (
                        <button
                          onClick={() => onStartRevision(task.id)}
                          className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-indigo-600"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          <span>Revise Now</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const subj = subjects.find((s) => s.id === task.subjectId);
                            if (subj) {
                              onStartStudy(
                                {
                                  id: task.unitId,
                                  subject_id: task.subjectId,
                                  user_id: '',
                                  unit_number: task.unitNumber,
                                  name: task.unitName,
                                  description: '',
                                  difficulty: 'Medium',
                                  estimated_minutes: task.estimatedMinutes,
                                  status: 'Studying',
                                  created_at: ''
                                },
                                subj
                              );
                            }
                          }}
                          className="btn btn-primary btn-sm flex items-center gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Study Day 1</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel p-8 text-center text-slate-400 space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto opacity-70" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">You are all caught up for today!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No pending revisions due today. Choose an unstudied unit below to start Day 1 and activate the 1-4-7 algorithm.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('subjects')}
                  className="btn btn-primary btn-sm text-xs mt-2"
                >
                  Start A New Unit
                </button>
              </div>
            )}
          </div>

          {/* Subject Progress Bars (Requirement 15) */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span>Subject-Wise 1-4-7 Mastery</span>
              </h3>
              <span className="text-xs text-indigo-300 font-semibold">
                Overall: {metrics?.overallStudyProgress || 0}%
              </span>
            </div>

            <div className="space-y-2.5">
              {subjectProgress?.map((subj: any) => (
                <div key={subj.id} className="glass-panel p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{subj.name}</span>
                    <span className="text-slate-300 font-mono">
                      {subj.masteredUnits} of {subj.totalUnits} Mastered ({subj.progressPercent}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, subj.progressPercent))}%`,
                        backgroundColor: subj.color || '#6366F1'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Revisions & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Revisions (next 7-14 days) (Requirement 11) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-purple-400" />
                <h2 className="text-base font-bold text-white">Upcoming Revisions</h2>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Full Calendar</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingRevisions && upcomingRevisions.length > 0 ? (
                upcomingRevisions.slice(0, 5).map((up: any) => (
                  <div
                    key={up.id}
                    className="p-3 rounded-xl border border-white/5 bg-slate-900/60 flex items-center justify-between text-xs transition hover:bg-slate-900"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`badge ${up.revision_number === 1 ? 'badge-day4' : 'badge-day7'} text-[10px]`}>
                          {up.stage_title}
                        </span>
                        <span className="text-[11px] text-slate-400">{up.subject_name}</span>
                      </div>
                      <div className="font-semibold text-slate-200">
                        {up.unit_number}: {up.name || up.unit_name}
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div className="font-mono text-xs text-purple-300 font-medium">
                        {up.scheduled_date}
                      </div>
                      <div className="text-[10px] text-slate-500">Scheduled</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs rounded-xl border border-white/5 bg-slate-900/40">
                  No upcoming revisions queued in the next 14 days.
                </div>
              )}
            </div>
          </div>

          {/* Recent Study Activity Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Recent Study Activity</span>
              </h2>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>View All History</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((act: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-white/5 bg-slate-900/60 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px] font-medium">{act.subject_name}</span>
                        <span>•</span>
                        <span className="text-indigo-300 font-semibold">{act.session_type}</span>
                      </div>
                      <div className="font-semibold text-white">
                        {act.unit_number}: {act.unit_name}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-slate-300 font-mono text-[11px]">
                        {act.duration_minutes} min{act.duration_minutes !== 1 ? 's' : ''}
                      </div>
                      {act.performance && (
                        <span className="text-[10px] font-medium text-emerald-400">
                          {act.performance}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs rounded-xl border border-white/5 bg-slate-900/40">
                  No recorded study sessions yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
