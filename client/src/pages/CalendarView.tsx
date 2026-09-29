import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCw,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Play,
  X
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { api } from '../api/client';

interface CalendarViewProps {
  onStartRevision: (revisionId: string) => void;
  onOpenUnit: (unitId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onStartRevision,
  onOpenUnit
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState<Record<string, any[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.calendar
      .getEvents()
      .then((res) => {
        setEventsByDate(res.byDate || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Starting day padding for Sunday start
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayEvents = eventsByDate[selectedDateStr] || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-400" />
            <span>Spaced Revision Calendar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize your Day 1 studies, Day 4 (+3d) and Day 7 (+6d) revision milestones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="font-display font-bold text-white text-sm min-w-36 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => {
              const now = new Date();
              setCurrentMonth(now);
              setSelectedDate(now);
            }}
            className="btn btn-secondary btn-sm text-xs ml-2"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-slate-900/60 p-3 rounded-xl border border-white/5">
        <span className="text-slate-400 font-semibold">Legend:</span>
        <div className="flex items-center gap-1.5 text-blue-400">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span>📚 Day 1 Study</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-400">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
          <span>🔄 Revise #1 (Day 4)</span>
        </div>
        <div className="flex items-center gap-1.5 text-pink-400">
          <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
          <span>🧠 Revise #2 (Day 7)</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span>⚠️ Overdue</span>
        </div>
      </div>

      {/* Calendar Grid & Selected Day Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Month Grid */}
        <div className="lg:col-span-8 glass-panel p-4 sm:p-6 overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2 pb-2 border-b border-white/5">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {paddingDays.map((i) => (
              <div key={`pad-${i}`} className="min-h-16 sm:min-h-24 p-1 rounded-xl bg-transparent" />
            ))}

            {daysInMonth.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const events = eventsByDate[dayStr] || [];
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-16 sm:min-h-24 p-1.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/30 shadow-md ring-1 ring-indigo-500'
                      : isCurrentDay
                      ? 'border-indigo-500/40 bg-slate-900/90'
                      : 'border-white/5 bg-slate-900/40 hover:bg-slate-900/80 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-md px-1.5 py-0.5 ${
                        isCurrentDay
                          ? 'bg-indigo-600 text-white font-extrabold'
                          : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {events.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {events.length}
                      </span>
                    )}
                  </div>

                  {/* Micro event pills */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {events.slice(0, 2).map((evt, idx) => {
                      const isOverdue = evt.category === 'overdue';
                      const isRev1 = evt.category === 'rev1';
                      const isRev2 = evt.category === 'rev2';
                      const isStudy = evt.category === 'study';

                      return (
                        <div
                          key={idx}
                          className={`truncate text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            isOverdue
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : isRev1
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : isRev2
                              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                              : isStudy
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                          title={`${evt.badge}: ${evt.unit_name || evt.subject_name}`}
                        >
                          {evt.badge}
                        </div>
                      );
                    })}
                    {events.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-medium pl-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="lg:col-span-4 glass-panel p-5 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
              Selected Day Overview
            </span>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            {isToday(selectedDate) && (
              <span className="badge badge-primary text-[10px] mt-1">Today</span>
            )}
          </div>

          <div className="space-y-3">
            {selectedDayEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No 1-4-7 study or revision milestones scheduled for this date.
              </div>
            ) : (
              selectedDayEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-white/10 bg-slate-900/90 space-y-2 hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`badge text-[10px] ${
                        evt.category === 'overdue'
                          ? 'badge-overdue'
                          : evt.category === 'rev1'
                          ? 'badge-day4'
                          : evt.category === 'rev2'
                          ? 'badge-day7'
                          : 'badge-day1'
                      }`}
                    >
                      {evt.badge}
                    </span>

                    <span className="text-[11px] text-slate-400 font-medium">
                      {evt.subject_name}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white">
                    {evt.unit_number ? `${evt.unit_number}: ` : ''}
                    {evt.unit_name}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Status: {evt.status}
                    </span>

                    {evt.category.startsWith('rev') || evt.category === 'overdue' ? (
                      evt.status !== 'Completed' ? (
                        <button
                          onClick={() => onStartRevision(evt.id)}
                          className="btn btn-primary btn-sm text-xs py-1 px-2.5 flex items-center gap-1 shadow-purple-500/20"
                        >
                          <RotateCw className="h-3 w-3" />
                          <span>Revise</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold">
                          Completed ✅
                        </span>
                      )
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
