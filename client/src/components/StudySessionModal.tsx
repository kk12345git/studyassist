import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  X,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Unit, Subject } from '../types';
import { api } from '../api/client';
import { format } from 'date-fns';

interface StudySessionModalProps {
  unit: Unit;
  subject: Subject;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  unit,
  subject,
  isOpen,
  onClose,
  onCompleted
}) => {
  if (!isOpen) return null;

  // Study timer state
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [studyDate, setStudyDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [startedAtIso, setStartedAtIso] = useState<string>(() => new Date().toISOString());

  // Notes & Checklist state
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: '1', text: 'Skim syllabus and main learning outcomes', done: false },
    { id: '2', text: 'Read conceptual explanations & derivations', done: false },
    { id: '3', text: 'Summarize key terms and definitions in your own words', done: false },
    { id: '4', text: 'Solve sample 2-mark and 5-mark exam questions', done: false }
  ]);
  const [newCheckItem, setNewCheckItem] = useState('');

  // Result Schedule Modal (shown right after completing study)
  const [scheduleResult, setScheduleResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Load existing unit notes if any
  useEffect(() => {
    api.notes.get(unit.id).then((data) => {
      if (data && data.content) {
        setNotes(data.content);
      }
    }).catch(() => {});
  }, [unit.id]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newCheckItem.trim(), done: false }
    ]);
    setNewCheckItem('');
  };

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((item) => item.id !== id));
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCompleteStudy = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');

      // Duration in minutes (at least 1 minute)
      const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60) || unit.estimated_minutes || 45);
      const completedAtIso = new Date().toISOString();

      const response = await api.study.complete({
        unitId: unit.id,
        subjectId: subject.id,
        studyDate,
        durationMinutes,
        startedAt: startedAtIso,
        completedAt: completedAtIso,
        notes,
        checklist
      });

      // Confetti burst for Day 1 completion
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {}

      setScheduleResult(response);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while creating your revision schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl text-slate-100 p-0 overflow-hidden">
        {/* Header Banner */}
        <div
          className="relative px-6 py-5 border-b border-white/10"
          style={{
            background: `linear-gradient(135deg, ${subject.color || '#4F46E5'}33 0%, #0F172A 100%)`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="badge badge-day1">Day 1 • Learn</span>
                <span className="text-xs text-slate-400 font-medium">{subject.name}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {unit.unit_number}: {unit.name}
              </h2>
              {unit.description && (
                <p className="text-xs text-slate-300 line-clamp-2 max-w-lg mt-1">
                  {unit.description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!scheduleResult ? (
          <div className="p-6 space-y-6">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Timer & Study Date bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center rounded-xl bg-slate-900/90 border border-white/10 p-4">
              {/* Interactive Timer */}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Study Timer
                  </span>
                  <div className="font-mono text-2xl font-bold text-white">
                    {formatTimer(secondsElapsed)}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  {!isRunning ? (
                    <button
                      onClick={() => setIsRunning(true)}
                      className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
                      title="Start Timer"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsRunning(false)}
                      className="p-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition"
                      title="Pause Timer"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsRunning(false);
                      setSecondsElapsed(0);
                    }}
                    className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Reset Timer"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Study Date Picker */}
              <div className="flex flex-col gap-1 sm:border-l sm:border-white/10 sm:pl-4">
                <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Day 1 Study Date</span>
                </label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={(e) => setStudyDate(e.target.value)}
                  className="input-field text-sm py-1.5"
                />
              </div>
            </div>

            {/* Checklist Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Study Checklist</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {checklist.filter((c) => c.done).length} of {checklist.length} done
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer text-xs transition ${
                      item.done
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded flex items-center justify-center border ${
                          item.done
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-slate-500 bg-transparent'
                        }`}
                      >
                        {item.done && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <span className={item.done ? 'line-through text-slate-400' : ''}>
                        {item.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChecklistItem(item.id);
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add checklist input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add checklist item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                <span>Day 1 Study Notes & Key Observations</span>
              </label>
              <textarea
                rows={3}
                placeholder="Write your initial takeaways, important formulas, or doubts for Day 4 revision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field text-xs leading-relaxed"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCompleteStudy}
                disabled={isSubmitting}
                className="btn btn-primary text-xs flex items-center gap-2 px-5 py-2.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Complete Study & Generate 1-4-7'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 1-4-7 Generation Announcement Card */
          <div className="p-6 space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
              <Sparkles className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                1-4-7 Schedule Generated!
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Spaced Repetition activated. Your first revision is scheduled in 3 days, and your second in 6 days to lock this knowledge into permanent memory.
              </p>
            </div>

            {/* Visual 1-4-7 Timeline Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {/* Day 1 */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="badge badge-mastered text-[10px]">DAY 1</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-sm font-semibold text-white">Initial Study</div>
                <div className="text-xs text-emerald-300 font-mono">
                  {scheduleResult.schedule?.day1?.date || studyDate}
                </div>
                <div className="text-[10px] text-emerald-400/80 font-medium">Completed ✅</div>
              </div>

              {/* Day 4 */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="badge badge-day4 text-[10px]">DAY 4</span>
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-sm font-semibold text-white">Revise #1</div>
                <div className="text-xs text-purple-300 font-mono">
                  {scheduleResult.schedule?.day4?.date}
                </div>
                <div className="text-[10px] text-purple-300/80 font-medium">Study Date + 3 days ⏳</div>
              </div>

              {/* Day 7 */}
              <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="badge badge-day7 text-[10px]">DAY 7</span>
                  <Clock className="h-4 w-4 text-pink-400" />
                </div>
                <div className="text-sm font-semibold text-white">Revise #2</div>
                <div className="text-xs text-pink-300 font-mono">
                  {scheduleResult.schedule?.day7?.date}
                </div>
                <div className="text-[10px] text-pink-300/80 font-medium">Study Date + 6 days ⏳</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 text-left">
              🔔 <strong>Automatic Reminders:</strong> You will receive push reminders on Day 4 and Day 7 to review this unit.
            </div>

            <button
              onClick={() => {
                onCompleted();
                onClose();
              }}
              className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
