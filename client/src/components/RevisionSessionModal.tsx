import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  X,
  Trophy,
  BookOpen,
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { RevisionSession, PerformanceRating } from '../types';
import { api } from '../api/client';
import { format } from 'date-fns';

interface RevisionSessionModalProps {
  revisionId: string;
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

export const RevisionSessionModal: React.FC<RevisionSessionModalProps> = ({
  revisionId,
  isOpen,
  onClose,
  onCompleted
}) => {
  if (!isOpen) return null;

  const [revision, setRevision] = useState<RevisionSession | null>(null);
  const [unitNotes, setUnitNotes] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Timer
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Feedback step
  const [performance, setPerformance] = useState<PerformanceRating>('Good');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [completionDate, setCompletionDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  // Completion modal state
  const [completionResult, setCompletionResult] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active view tab in modal (Review Notes vs Questions)
  const [activeTab, setActiveTab] = useState<'review' | 'questions'>('review');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (revisionId) {
      setLoading(true);
      api.revisions
        .getDetails(revisionId)
        .then((data) => {
          setRevision(data);
          if (data.notes) {
            setUnitNotes(data.notes);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [revisionId]);

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

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFinishRevision = async () => {
    if (!revision) return;
    try {
      setIsSubmitting(true);
      const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60) || 15);

      const res = await api.revisions.complete(revision.id, {
        performance,
        durationMinutes,
        completionDate,
        feedbackNotes
      });

      // If unit is mastered, fire majestic confetti celebration!
      if (res.isMastered) {
        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      } else {
        try {
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 }
          });
        } catch (e) {}
      }

      setCompletionResult(res);
    } catch (err) {
      console.error(err);
      alert('Failed to complete revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !revision) {
    return (
      <div className="modal-overlay">
        <div className="modal-content p-8 text-center text-slate-400">
          Loading revision session...
        </div>
      </div>
    );
  }

  const isOverdue = revision.status === 'Overdue' || (revision.scheduled_date < format(new Date(), 'yyyy-MM-dd') && revision.status !== 'Completed');
  const currentDaysLate = revision.current_days_late || 0;

  const performanceOptions: Array<{ value: PerformanceRating; emoji: string; label: string; desc: string }> = [
    { value: 'Difficult', emoji: '😟', label: 'Difficult', desc: 'Struggled to recall key terms' },
    { value: 'Average', emoji: '😐', label: 'Average', desc: 'Remembered about half' },
    { value: 'Good', emoji: '🙂', label: 'Good', desc: 'Recalled main concepts clearly' },
    { value: 'Excellent', emoji: '🔥', label: 'Excellent', desc: 'Instant active recall' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl text-slate-100 p-0 overflow-hidden">
        {/* Banner */}
        <div
          className="relative px-6 py-5 border-b border-white/10"
          style={{
            background: `linear-gradient(135deg, ${revision.subject_color || '#8B5CF6'}33 0%, #0F172A 100%)`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`badge ${revision.revision_number === 1 ? 'badge-day4' : 'badge-day7'}`}>
                  {revision.stage_title} ({revision.revision_number === 1 ? 'Day 4' : 'Day 7'})
                </span>
                <span className="text-xs text-slate-400 font-medium">{revision.subject_name}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {revision.unit_number}: {revision.unit_name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-1">
                <span>Original Study: <strong>{revision.original_study_date}</strong></span>
                <span>•</span>
                <span>Scheduled: <strong>{revision.scheduled_date}</strong></span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Overdue Alert Bar if applicable */}
        {isOverdue && !completionResult && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-rose-500/15 border-b border-rose-500/30 text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                <strong>Overdue Revision:</strong> Scheduled for {revision.scheduled_date} ({currentDaysLate} day{currentDaysLate !== 1 ? 's' : ''} overdue).
              </span>
            </div>
            <span className="font-semibold text-rose-200">Revise Now</span>
          </div>
        )}

        {/* Modal Body */}
        {!completionResult ? (
          <div className="p-6 space-y-6">
            {/* Revision Timer & Completion Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center rounded-xl bg-slate-900/90 border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                    Revision Timer
                  </span>
                  <div className="font-mono text-2xl font-bold text-white">
                    {formatTimer(secondsElapsed)}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-auto">
                  {!isRunning ? (
                    <button
                      onClick={() => setIsRunning(true)}
                      className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition"
                      title="Start Revision Timer"
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
                </div>
              </div>

              <div className="flex flex-col gap-1 sm:border-l sm:border-white/10 sm:pl-4">
                <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-purple-400" />
                  <span>Completion Date</span>
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="input-field text-sm py-1.5"
                />
              </div>
            </div>

            {/* Quick Review Tabs: Saved Notes & Exam Questions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'review'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3 w-3 inline mr-1" />
                  Saved Unit Notes
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('questions')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'questions'
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <HelpCircle className="h-3 w-3 inline mr-1" />
                  University Exam Qs
                </button>
              </div>

              {activeTab === 'review' ? (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 max-h-40 overflow-y-auto text-xs space-y-2">
                  {unitNotes?.content ? (
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                      {unitNotes.content}
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">No detailed notes saved yet. Review your textbook and summarize here!</p>
                  )}

                  {unitNotes?.important_points && JSON.parse(unitNotes.important_points || '[]').length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="font-semibold text-purple-300 mb-1">Key Points:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {JSON.parse(unitNotes.important_points).map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 max-h-40 overflow-y-auto text-xs space-y-2">
                  {unitNotes?.questions_2m && JSON.parse(unitNotes.questions_2m || '[]').length > 0 ? (
                    <div className="space-y-2">
                      <div className="font-semibold text-amber-300">2-Mark Questions:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {JSON.parse(unitNotes.questions_2m).map((q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No university questions stored yet. Use the Notes & Qs tab to add some!</p>
                  )}
                </div>
              )}
            </div>

            {/* Retention Rating Section */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>How well do you remember?</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {performanceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPerformance(opt.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      performance === opt.value
                        ? 'bg-purple-600/25 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-2xl mb-1">{opt.emoji}</span>
                    <span className="text-xs font-bold text-slate-100">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Feedback Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Revision Remarks / Doubts to clarify later
              </label>
              <input
                type="text"
                placeholder="e.g. Need to re-read difference between functional and planning regions"
                value={feedbackNotes}
                onChange={(e) => setFeedbackNotes(e.target.value)}
                className="input-field text-xs py-1.5"
              />
            </div>

            {/* Action Buttons */}
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
                onClick={handleFinishRevision}
                disabled={isSubmitting}
                className="btn btn-primary text-xs flex items-center gap-2 px-5 py-2.5 shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Saving...' : 'Mark Revision Completed'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion & Mastery Announcement */
          <div className="p-6 space-y-6 text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                completionResult.isMastered
                  ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/30'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30'
              }`}
            >
              {completionResult.isMastered ? (
                <Trophy className="h-8 w-8" />
              ) : (
                <CheckCircle2 className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-white">
                {completionResult.isMastered ? '🏆 1-4-7 Completed!' : 'Revision Completed!'}
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                {completionResult.isMastered
                  ? `Incredible dedication! You have completed Day 1, Day 4, and Day 7 revisions for "${revision.unit_number}: ${revision.unit_name}". This unit is now marked MASTERED.`
                  : `Great job completing ${revision.stage_title}! Your memory trace has been reinforced according to the 1-4-7 schedule.`}
              </p>
            </div>

            {/* Visual 1-4-7 Milestone Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-left text-xs">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 space-y-0.5">
                <div className="font-bold text-emerald-300">✅ Day 1</div>
                <div className="text-[11px] text-white">Learn</div>
                <div className="text-[10px] text-emerald-400">Done</div>
              </div>

              <div
                className={`rounded-xl border p-2.5 space-y-0.5 ${
                  revision.revision_number === 1 || completionResult.isMastered
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/10 bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="font-bold">
                  {revision.revision_number === 1 || completionResult.isMastered ? '✅ Day 4' : '⏳ Day 4'}
                </div>
                <div className="text-[11px] text-white">Revise #1</div>
                <div className="text-[10px] text-slate-400">
                  {revision.revision_number === 1 ? 'Completed' : 'Pending'}
                </div>
              </div>

              <div
                className={`rounded-xl border p-2.5 space-y-0.5 ${
                  completionResult.isMastered
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/10 bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="font-bold">
                  {completionResult.isMastered ? '🏆 Day 7' : '⏳ Day 7'}
                </div>
                <div className="text-[11px] text-white">Revise #2</div>
                <div className="text-[10px]">
                  {completionResult.isMastered ? 'Mastered!' : 'Pending'}
                </div>
              </div>
            </div>

            {completionResult.daysLate > 0 && (
              <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                ⚠️ Completed {completionResult.daysLate} day{completionResult.daysLate !== 1 ? 's' : ''} late. Original schedule preserved to maintain long-term memory anchor!
              </div>
            )}

            <button
              onClick={() => {
                onCompleted();
                onClose();
              }}
              className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
