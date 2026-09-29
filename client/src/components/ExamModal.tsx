import React, { useState } from 'react';
import { X, Target, Calendar } from 'lucide-react';
import { Subject } from '../types';
import { api } from '../api/client';

interface ExamModalProps {
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ExamModal: React.FC<ExamModalProps> = ({
  subjects,
  isOpen,
  onClose,
  onSaved
}) => {
  if (!isOpen) return null;

  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('90%+');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setError('Please select a subject');
      return;
    }
    if (!examName.trim()) {
      setError('Please enter the exam name');
      return;
    }
    if (!examDate) {
      setError('Please select the exam date');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.exam.create({
        subject_id: subjectId,
        exam_name: examName.trim(),
        exam_date: examDate,
        target_score: targetScore,
        notes: notes.trim()
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create exam plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Target Exam Plan</h3>
              <p className="text-[11px] text-slate-400">Track countdown, syllabus coverage, and readiness</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Select Subject <span className="text-rose-400">*</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="input-field text-xs py-2"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Exam Name / Semester Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. M.A. Economics University Final Exam"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="input-field text-xs py-2"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-pink-400" />
                <span>Exam Date</span> <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="input-field text-xs py-2"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Target Score / Grade
              </label>
              <input
                type="text"
                placeholder="e.g. 90%+ or Grade A"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="input-field text-xs py-2"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Preparation Strategy & Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Must finish all 1-4-7 revisions for Unit I & II by Oct 15..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-xs bg-gradient-to-r from-pink-600 to-indigo-600"
            >
              {isSubmitting ? 'Saving...' : 'Add Exam Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
