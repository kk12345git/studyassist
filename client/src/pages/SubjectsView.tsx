import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  RotateCw,
  Trophy,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Subject, Unit, RevisionSession } from '../types';
import { api } from '../api/client';

interface SubjectsViewProps {
  subjects: Subject[];
  onRefreshSubjects: () => void;
  onOpenCreateSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onOpenAddUnit: (subject: Subject) => void;
  onEditUnit: (subject: Subject, unit: Unit) => void;
  onStartStudy: (unit: Unit, subject: Subject) => void;
  onStartRevision: (revisionId: string) => void;
  onOpenNotes: (unitId: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onRefreshSubjects,
  onOpenCreateSubject,
  onEditSubject,
  onOpenAddUnit,
  onEditUnit,
  onStartStudy,
  onStartRevision,
  onOpenNotes
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [subjectUnits, setSubjectUnits] = useState<Record<string, Unit[]>>({});
  const [loadingUnits, setLoadingUnits] = useState<Record<string, boolean>>({});

  // Auto-expand the first subject on load
  useEffect(() => {
    if (subjects.length > 0) {
      const firstId = subjects[0].id;
      setExpandedSubjects((prev) => ({ ...prev, [firstId]: true }));
      loadUnitsForSubject(firstId);
    }
  }, [subjects]);

  const loadUnitsForSubject = async (subjectId: string) => {
    try {
      setLoadingUnits((prev) => ({ ...prev, [subjectId]: true }));
      const units = await api.units.listBySubject(subjectId);
      setSubjectUnits((prev) => ({ ...prev, [subjectId]: units }));
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoadingUnits((prev) => ({ ...prev, [subjectId]: false }));
    }
  };

  const toggleSubject = (subjectId: string) => {
    const isNowExpanded = !expandedSubjects[subjectId];
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: isNowExpanded }));
    if (isNowExpanded && !subjectUnits[subjectId]) {
      loadUnitsForSubject(subjectId);
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" and all its units/revisions?`)) {
      await api.subjects.delete(id);
      onRefreshSubjects();
    }
  };

  const handleDeleteUnit = async (subjectId: string, unitId: string, name: string) => {
    if (window.confirm(`Delete unit "${name}"?`)) {
      await api.units.delete(unitId);
      loadUnitsForSubject(subjectId);
      onRefreshSubjects();
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            <span>Subject & Curriculum Roadmap</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize units and follow the 1-4-7 spaced revision sequence for each chapter.
          </p>
        </div>

        <button
          onClick={onOpenCreateSubject}
          className="btn btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Subjects Accordion Cards */}
      <div className="space-y-4">
        {subjects.map((subject) => {
          const isExpanded = !!expandedSubjects[subject.id];
          const units = subjectUnits[subject.id] || [];
          const isLoading = loadingUnits[subject.id];
          const stats = subject.stats;

          return (
            <div
              key={subject.id}
              className="glass-panel overflow-hidden border border-white/10"
              style={{
                borderLeft: `4px solid ${subject.color || '#6366F1'}`
              }}
            >
              {/* Subject Header */}
              <div
                onClick={() => toggleSubject(subject.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition"
              >
                <div className="flex items-start gap-3">
                  <button className="text-slate-400 hover:text-white p-1 rounded mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {subject.name}
                      </h2>
                      {subject.is_archived === 1 && (
                        <span className="badge badge-primary text-[10px]">Archived</span>
                      )}
                    </div>
                    {subject.description && (
                      <p className="text-xs text-slate-400 max-w-xl line-clamp-1">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Stats Pills & Actions */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                  {stats && (
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs bg-slate-900/90 px-3 sm:px-3.5 py-1.5 rounded-xl border border-white/10">
                      <div className="text-slate-300">
                        <strong className="text-white">{stats.totalUnits}</strong> Units
                      </div>
                      <span className="text-slate-600 hidden xs:inline">•</span>
                      <div className="text-emerald-400">
                        <strong>{stats.masteredUnits}</strong> Mastered
                      </div>
                      <span className="text-slate-600 hidden xs:inline">•</span>
                      <div className="text-indigo-400 font-semibold">
                        {stats.overallProgressPct}% Complete
                      </div>
                    </div>
                  )}

                  {/* Actions dropdown */}
                  <div className="flex items-center gap-1 ml-auto md:ml-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenAddUnit(subject)}
                      className="btn btn-secondary btn-sm text-xs flex items-center gap-1 font-semibold"
                      title="Add Unit"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Unit</span>
                    </button>
                    <button
                      onClick={() => onEditSubject(subject)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                      title="Edit Subject"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10"
                      title="Delete Subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Progress bar line */}
              {stats && (
                <div className="h-1 w-full bg-slate-800">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${stats.overallProgressPct}%`,
                      backgroundColor: subject.color || '#6366F1'
                    }}
                  />
                </div>
              )}

              {/* Units List */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-white/5 bg-slate-950/40 space-y-3">
                  {isLoading ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Loading curriculum units...
                    </div>
                  ) : units.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs space-y-2">
                      <p>No units added to {subject.name} yet.</p>
                      <button
                        onClick={() => onOpenAddUnit(subject)}
                        className="btn btn-primary btn-sm text-xs"
                      >
                        + Add First Unit
                      </button>
                    </div>
                  ) : (
                    units.map((unit) => {
                      const isMastered = unit.status === 'Mastered';
                      const isStudying = unit.status === 'Studying';
                      const isRevisionScheduled = unit.status === 'Revision Scheduled';
                      const isRev1Done = unit.status === 'Revision 1 Completed';
                      const isNotStarted = unit.status === 'Not Started';

                      // Determine next revision action
                      const pendingRevisions = unit.revisions?.filter((r) => r.status !== 'Completed') || [];
                      const nextRevision = pendingRevisions[0];

                      return (
                        <div
                          key={unit.id}
                          className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 hover:border-white/20 transition"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">
                                  {unit.unit_number}: {unit.name}
                                </span>

                                {/* Difficulty badge */}
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    unit.difficulty === 'Easy'
                                      ? 'bg-emerald-500/15 text-emerald-300'
                                      : unit.difficulty === 'Medium'
                                      ? 'bg-amber-500/15 text-amber-300'
                                      : 'bg-rose-500/15 text-rose-300'
                                  }`}
                                >
                                  {unit.difficulty}
                                </span>

                                {/* Status badge */}
                                {isMastered ? (
                                  <span className="badge badge-mastered text-[10px]">
                                    🏆 Mastered
                                  </span>
                                ) : isRev1Done ? (
                                  <span className="badge badge-day7 text-[10px]">
                                    Day 4 Done • Day 7 Pending
                                  </span>
                                ) : isRevisionScheduled ? (
                                  <span className="badge badge-day4 text-[10px]">
                                    Day 1 Done • Revisions Queued
                                  </span>
                                ) : isStudying ? (
                                  <span className="badge badge-primary text-[10px]">
                                    In Progress
                                  </span>
                                ) : (
                                  <span className="badge text-[10px] bg-slate-800 text-slate-400">
                                    Not Started
                                  </span>
                                )}
                              </div>

                              {unit.description && (
                                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                                  {unit.description}
                                </p>
                              )}

                              <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Est. {unit.estimated_minutes} mins</span>
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                              {/* If not started or re-studying */}
                              {isNotStarted ? (
                                <button
                                  onClick={() => onStartStudy(unit, subject)}
                                  className="btn btn-primary btn-sm text-xs flex items-center gap-1.5"
                                >
                                  <Play className="h-3.5 w-3.5" />
                                  <span>Start Day 1</span>
                                </button>
                              ) : nextRevision ? (
                                <button
                                  onClick={() => onStartRevision(nextRevision.id)}
                                  className="btn btn-primary btn-sm text-xs flex items-center gap-1.5 shadow-purple-500/20 bg-gradient-to-r from-purple-600 to-indigo-600"
                                >
                                  <RotateCw className="h-3.5 w-3.5" />
                                  <span>Revise #{nextRevision.revision_number}</span>
                                </button>
                              ) : isMastered ? (
                                <button
                                  onClick={() => onStartStudy(unit, subject)}
                                  className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
                                >
                                  <RotateCw className="h-3 w-3" />
                                  <span>Re-study</span>
                                </button>
                              ) : null}

                              <button
                                onClick={() => onOpenNotes(unit.id)}
                                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                                title="Unit Notes & University Exam Questions"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => onEditUnit(subject, unit)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                                title="Edit Unit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteUnit(subject.id, unit.id, unit.name)}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                                title="Delete Unit"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* 1-4-7 Visual Stepper per unit (Requirement 7) */}
                          <div className="pt-2 border-t border-white/5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              {/* Step 1: Day 1 Learn */}
                              <div
                                className={`p-2 rounded-xl border flex items-center justify-between ${
                                  unit.studySession
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                    : 'bg-slate-950/60 border-white/5 text-slate-400'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-bold flex items-center gap-1 text-[11px]">
                                    <span>DAY 1</span>
                                    <span>• Learn</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {unit.studySession?.study_date || 'Pending study'}
                                  </div>
                                </div>
                                {unit.studySession && (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                )}
                              </div>

                              {/* Step 2: Day 4 Revise #1 */}
                              {(() => {
                                const rev1 = unit.revisions?.find((r) => r.revision_number === 1);
                                const isRev1Done = rev1?.status === 'Completed';
                                const isOverdue = rev1?.status === 'Overdue' || (rev1?.scheduled_date && rev1.scheduled_date < new Date().toISOString().substring(0, 10) && !isRev1Done);

                                return (
                                  <div
                                    className={`p-2 rounded-xl border flex items-center justify-between ${
                                      isRev1Done
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                        : isOverdue
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                                        : rev1
                                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                                        : 'bg-slate-950/60 border-white/5 text-slate-400'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold flex items-center gap-1 text-[11px]">
                                        <span>DAY 4</span>
                                        <span>• Revise #1</span>
                                      </div>
                                      <div className="text-[10px] font-mono opacity-80">
                                        {rev1?.scheduled_date ? `${rev1.scheduled_date} (+3d)` : 'Queued on Day 1'}
                                      </div>
                                    </div>

                                    {isRev1Done ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                    ) : isOverdue ? (
                                      <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                                    ) : rev1 ? (
                                      <Clock className="h-4 w-4 text-purple-400 shrink-0" />
                                    ) : null}
                                  </div>
                                );
                              })()}

                              {/* Step 3: Day 7 Revise #2 */}
                              {(() => {
                                const rev2 = unit.revisions?.find((r) => r.revision_number === 2);
                                const isRev2Done = rev2?.status === 'Completed';

                                return (
                                  <div
                                    className={`p-2 rounded-xl border flex items-center justify-between ${
                                      isRev2Done
                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                        : rev2
                                        ? 'bg-pink-500/10 border-pink-500/30 text-pink-200'
                                        : 'bg-slate-950/60 border-white/5 text-slate-400'
                                    }`}
                                  >
                                    <div className="space-y-0.5">
                                      <div className="font-bold flex items-center gap-1 text-[11px]">
                                        <span>DAY 7</span>
                                        <span>• Revise #2</span>
                                      </div>
                                      <div className="text-[10px] font-mono opacity-80">
                                        {rev2?.scheduled_date ? `${rev2.scheduled_date} (+6d)` : 'Queued on Day 1'}
                                      </div>
                                    </div>

                                    {isRev2Done ? (
                                      <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
                                    ) : rev2 ? (
                                      <Clock className="h-4 w-4 text-pink-400 shrink-0" />
                                    ) : null}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
