import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Award,
  ShieldAlert,
  Flame,
  Zap
} from 'lucide-react';
import { api } from '../api/client';
import { User, UserSettings } from '../types';

interface OnboardingModalProps {
  user: User;
  onComplete: (updatedUser: User, updatedSettings: UserSettings) => void;
}

const UNIVERSITY_SUGGESTIONS = [
  'Anna University',
  'IIT / NIT',
  'Stanford University',
  'Oxford University',
  'MIT',
  'National University',
  'University of California',
  'Cambridge University'
];

const DEGREE_SUGGESTIONS = [
  'B.E. / B.Tech Computer Science',
  'Information Technology',
  'Mechanical Engineering',
  'Business Administration (BBA/MBA)',
  'Medicine / Health Sciences',
  'Data Science & AI',
  'Commerce / Economics'
];

const YEAR_OPTIONS = [
  '1st Year / Semester 1 & 2',
  '2nd Year / Semester 3 & 4',
  '3rd Year / Semester 5 & 6',
  'Final Year / Semester 7 & 8',
  'Postgraduate / Masters',
  'Competitive Exam Prep'
];

const COLOR_OPTIONS = [
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Cyan', hex: '#06B6D4' }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Academic Identity
  const [name, setName] = useState(user.name || '');
  const [university, setUniversity] = useState(user.university || '');
  const [degree, setDegree] = useState(user.degree || '');
  const [academicYear, setAcademicYear] = useState(user.academic_year || YEAR_OPTIONS[0]);

  // Step 2: Study Habits
  const [targetHours, setTargetHours] = useState<number>(user.target_study_hours || 3);
  const [studyGoal, setStudyGoal] = useState<string>(
    user.study_goal || 'Top 5% Semester GPA & Mastery with 1-4-7 Spaced Repetition'
  );
  const [reminderTime, setReminderTime] = useState('19:00');

  // Step 3: First Subject & Syllabus
  const [subjectName, setSubjectName] = useState('Data Structures & Algorithms');
  const [subjectDescription, setSubjectDescription] = useState('Core university syllabus and spaced revision topics');
  const [subjectColor, setSubjectColor] = useState('#6366F1');
  const [units, setUnits] = useState<Array<{ name: string; estimated_minutes: number; difficulty: string }>>([
    { name: 'Arrays, Linked Lists & Stacks', estimated_minutes: 60, difficulty: 'Medium' },
    { name: 'Binary Trees & Graph Traversals', estimated_minutes: 90, difficulty: 'Hard' },
    { name: 'Dynamic Programming & Greedy Algorithms', estimated_minutes: 120, difficulty: 'Hard' }
  ]);

  const handleAddUnit = () => {
    setUnits([
      ...units,
      {
        name: `Chapter ${units.length + 1}`,
        estimated_minutes: 60,
        difficulty: 'Medium'
      }
    ]);
  };

  const handleRemoveUnit = (index: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleUnitChange = (index: number, field: string, value: any) => {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: value };
    setUnits(updated);
  };

  const handleFinishOnboarding = async () => {
    try {
      setSubmitting(true);
      setError('');

      const res = await api.auth.completeOnboarding({
        university: university.trim(),
        degree: degree.trim(),
        academic_year: academicYear,
        target_study_hours: targetHours,
        study_goal: studyGoal.trim(),
        reminder_time: reminderTime,
        subject: {
          name: subjectName.trim(),
          description: subjectDescription.trim(),
          color: subjectColor,
          units: units.map((u) => ({
            name: u.name.trim(),
            estimated_minutes: Number(u.estimated_minutes) || 60,
            difficulty: u.difficulty
          }))
        }
      });

      if (res && res.user) {
        onComplete(res.user, res.settings);
      }
    } catch (err: any) {
      console.error('Onboarding failed:', err);
      setError(err.message || 'Could not complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-500/10 overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Glow Highlights */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-6 py-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/30 ring-1 ring-white/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
                Newcomer Welcome & Database Setup
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Step {step} of 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize your academic database and initialize your 1-4-7 study engine
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5">
          <div
            className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Content Body */}
        <div className="relative z-10 p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Academic Identity */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <GraduationCap className="h-4 w-4" />
                <span>Academic Profile</span>
              </div>
              <h3 className="text-base font-bold text-white">Who are you studying with?</h3>
              <p className="text-xs text-slate-400 -mt-2">
                Enter your university and degree so StudyAssist can organize your subjects and calendar properly.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                  placeholder="e.g. Alex Morgan"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">University / College / Institution</label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                  placeholder="e.g. Stanford University or Anna University"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {UNIVERSITY_SUGGESTIONS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setUniversity(sug)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-200 border border-white/5 transition"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Degree / Major / Course</label>
                <input
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                  placeholder="e.g. B.Tech Computer Science & Engineering"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DEGREE_SUGGESTIONS.slice(0, 4).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDegree(sug)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-200 border border-white/5 transition"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year / Semester</label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                >
                  {YEAR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900 text-white">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Study Habits & Personal Goals */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Target className="h-4 w-4" />
                <span>Habits & Retention Objectives</span>
              </div>
              <h3 className="text-base font-bold text-white">Your study rhythm and goals</h3>
              <p className="text-xs text-slate-400 -mt-2">
                Configure your daily study capacity and spaced reminder schedule.
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Daily Target Study Hours</label>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {targetHours} Hours / Day
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={targetHours}
                  onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1 Hour (Light)</span>
                  <span>3 Hours (Recommended)</span>
                  <span>8 Hours (Intense)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Academic Target / Goal</label>
                <textarea
                  rows={2}
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500 py-2"
                  placeholder="e.g. Master all subjects with 9.0+ CGPA and zero backlogs."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Daily Spaced Revision Reminder Time
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500 w-40"
                  />
                  <span className="text-xs text-slate-400">
                    You will receive gentle prompts for Day 4 (+3d) and Day 7 (+6d) revisions.
                  </span>
                </div>
              </div>

              {/* The 1-4-7 Rule Explainer Badge */}
              <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-xs space-y-1.5">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-400" />
                  <span>The 1-4-7 Scientific Retention Principle</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  • <strong>Day 1:</strong> First study session & initial deep comprehension.<br />
                  • <strong>Day 4 (+3 days):</strong> First spaced recall to flatten the Ebbinghaus forgetting curve.<br />
                  • <strong>Day 7 (+6 days):</strong> Final mastery revision lock-in for permanent long-term memory.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: First Subject & Syllabus Curriculum */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <BookOpen className="h-4 w-4" />
                <span>Your First Subject & Syllabus</span>
              </div>
              <h3 className="text-base font-bold text-white">Create your first subject and chapters</h3>
              <p className="text-xs text-slate-400 -mt-2">
                This will immediately initialize your personal database with your actual curriculum.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                    placeholder="e.g. Operating Systems"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Theme Color</label>
                  <div className="flex items-center gap-2 h-10 px-2 rounded-lg bg-slate-950/60 border border-white/10">
                    {COLOR_OPTIONS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setSubjectColor(col.hex)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          subjectColor === col.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: col.hex }}
                        title={col.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  className="w-full input text-sm bg-slate-950/60 border-white/10 focus:border-indigo-500"
                  placeholder="e.g. Semester syllabus units, lab experiments and exam prep"
                />
              </div>

              {/* Units / Chapters List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Syllabus Chapters / Units ({units.length})</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddUnit}
                    className="btn btn-secondary btn-sm text-xs py-1 px-2.5 flex items-center gap-1 border-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {units.map((u, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/50 border border-white/10 text-xs"
                    >
                      <span className="font-bold text-slate-400 w-12 shrink-0">U{idx + 1}</span>
                      <input
                        type="text"
                        value={u.name}
                        onChange={(e) => handleUnitChange(idx, 'name', e.target.value)}
                        placeholder="Chapter title"
                        className="flex-1 bg-transparent border-none text-white focus:outline-none text-xs"
                      />
                      <select
                        value={u.difficulty}
                        onChange={(e) => handleUnitChange(idx, 'difficulty', e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                      <input
                        type="number"
                        min="15"
                        max="360"
                        step="15"
                        value={u.estimated_minutes}
                        onChange={(e) => handleUnitChange(idx, 'estimated_minutes', e.target.value)}
                        className="w-14 bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-[11px] text-slate-300 text-center"
                        title="Estimated study minutes"
                      />
                      <span className="text-[10px] text-slate-400">min</span>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Initialize Database */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Ready to Initialize Your Database</span>
              </div>
              <h3 className="text-base font-bold text-white">Review your personal study database</h3>
              <p className="text-xs text-slate-400 -mt-2">
                All details below will be saved permanently as your primary study database.
              </p>

              {/* Summary Card */}
              <div className="p-4 rounded-xl border border-white/10 bg-slate-950/60 space-y-3">
                <div className="flex items-start justify-between border-b border-white/10 pb-3">
                  <div>
                    <h4 className="font-bold text-white text-sm">{name}</h4>
                    <p className="text-xs text-indigo-300">
                      {degree || 'Degree Program'} · {university || 'University'}
                    </p>
                    <span className="text-[11px] text-slate-400">{academicYear}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Target: {targetHours}h / day
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">Daily reminder at {reminderTime}</p>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subjectColor }} />
                    <span>Primary Subject: {subjectName}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{subjectDescription}</p>

                  <div className="space-y-1">
                    {units.map((u, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-white/5 text-slate-300"
                      >
                        <span>
                          <strong>Unit {i + 1}:</strong> {u.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                            {u.difficulty}
                          </span>
                          <span className="text-slate-400">{u.estimated_minutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>
                    Your 1-4-7 spaced repetition schedule will automatically activate upon completing each chapter.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="relative z-10 px-6 py-4 border-t border-white/10 bg-slate-900/90 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs border-white/10"
              disabled={submitting}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && (!university.trim() || !degree.trim())) {
                  setError('Please fill in your university and degree program.');
                  return;
                }
                if (step === 3 && !subjectName.trim()) {
                  setError('Please provide a subject name.');
                  return;
                }
                setError('');
                setStep((step + 1) as any);
              }}
              className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs shadow-indigo-500/20"
            >
              <span>Continue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={submitting}
              className="btn btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-lg shadow-indigo-500/25 border-none"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating Database...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Launch My Personal Study Database</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
