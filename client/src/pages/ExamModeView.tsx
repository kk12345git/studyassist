import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api/client';
import { ExamPlan, Subject } from '../types';

interface ExamModeViewProps {
  subjects: Subject[];
  onOpenCreateExam: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ExamModeView: React.FC<ExamModeViewProps> = ({
  subjects,
  onOpenCreateExam,
  onNavigateTab
}) => {
  const [plans, setPlans] = useState<ExamPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await api.exam.list();
      setPlans(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete exam plan for "${name}"?`)) {
      await api.exam.delete(id);
      loadPlans();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6 text-pink-400" />
            <span>University Exam Mode</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time exam countdown timer, pending syllabus calculator, and 1-4-7 readiness score.
          </p>
        </div>

        <button
          onClick={onOpenCreateExam}
          className="btn btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto bg-gradient-to-r from-pink-600 to-indigo-600"
        >
          <Plus className="h-4 w-4" />
          <span>New Target Exam</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          Loading exam readiness data...
        </div>
      ) : plans.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 space-y-4">
          <Target className="h-12 w-12 text-pink-400 mx-auto opacity-50" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No target exams set yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add your upcoming semester finals or entrance exams to get a countdown and automated syllabus completion timeline.
            </p>
          </div>
          <button onClick={onOpenCreateExam} className="btn btn-primary btn-sm text-xs">
            + Set Exam Date
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => {
            return (
              <div
                key={plan.id}
                className="glass-panel p-6 space-y-5 border border-white/10 hover:border-white/20 transition relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="badge badge-day7 text-[10px]">
                      {plan.subject_name}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {plan.exam_name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-pink-400" />
                      <span>Exam Date: <strong>{plan.exam_date}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(plan.id, plan.exam_name)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg"
                    title="Delete Exam Plan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Big Countdown Metric Card */}
                <div className="rounded-2xl bg-gradient-to-tr from-pink-950/40 via-slate-900 to-indigo-950/40 border border-pink-500/20 p-4 flex items-center justify-around text-center">
                  <div>
                    <div className="text-3xl font-display font-extrabold text-pink-300">
                      {plan.daysRemaining}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                      Days Remaining
                    </div>
                  </div>

                  <div className="h-10 w-px bg-white/10" />

                  <div>
                    <div className="text-3xl font-display font-extrabold text-indigo-300">
                      {plan.remainingUnits}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                      Units Remaining
                    </div>
                  </div>

                  <div className="h-10 w-px bg-white/10" />

                  <div>
                    <div className="text-3xl font-display font-extrabold text-purple-300">
                      {plan.revisionsRemaining}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                      Revisions Due
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">
                      Syllabus Mastery Progress
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {plan.progressPercent}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, plan.progressPercent))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>{plan.completedUnits} of {plan.totalUnits} Units Mastered</span>
                    <span>Target: {plan.target_score || '90%+'}</span>
                  </div>
                </div>

                {/* Notes */}
                {plan.notes && (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 leading-relaxed">
                    📝 <strong>Strategy:</strong> {plan.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onNavigateTab('subjects')}
                    className="btn btn-secondary btn-sm text-xs"
                  >
                    View Units
                  </button>
                  <button
                    onClick={() => onNavigateTab('calendar')}
                    className="btn btn-primary btn-sm text-xs bg-pink-600 hover:bg-pink-500 border-none"
                  >
                    View Calendar Timeline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
