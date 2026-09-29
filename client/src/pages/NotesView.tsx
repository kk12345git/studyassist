import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { Subject, Unit } from '../types';

interface NotesViewProps {
  subjects: Subject[];
  initialUnitId?: string;
  onOpenAI: (unitId: string) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  subjects,
  initialUnitId,
  onOpenAI
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState(initialUnitId || '');

  // Notes state
  const [content, setContent] = useState('');
  const [importantPoints, setImportantPoints] = useState<string[]>([]);
  const [newPoint, setNewPoint] = useState('');

  const [keyTerms, setKeyTerms] = useState<Array<{ term: string; definition: string }>>([]);
  const [newTerm, setNewTerm] = useState('');
  const [newDef, setNewDef] = useState('');

  // University Exam Questions
  const [q2m, setQ2m] = useState<string[]>([]);
  const [newQ2m, setNewQ2m] = useState('');

  const [q5m, setQ5m] = useState<string[]>([]);
  const [newQ5m, setNewQ5m] = useState('');

  const [q10m, setQ10m] = useState<string[]>([]);
  const [newQ10m, setNewQ10m] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load units for selected subject
  useEffect(() => {
    if (selectedSubjectId) {
      api.units.listBySubject(selectedSubjectId).then((data) => {
        setUnits(data || []);
        if (data.length > 0) {
          const match = data.find((u) => u.id === initialUnitId);
          setSelectedUnitId(match ? match.id : data[0].id);
        } else {
          setSelectedUnitId('');
        }
      });
    }
  }, [selectedSubjectId, initialUnitId]);

  // Load notes for selected unit
  useEffect(() => {
    if (selectedUnitId) {
      api.notes.get(selectedUnitId).then((data) => {
        if (data) {
          setContent(data.content || '');
          setImportantPoints(data.important_points || []);
          setKeyTerms(data.key_terms || []);
          setQ2m(data.questions_2m || []);
          setQ5m(data.questions_5m || []);
          setQ10m(data.questions_10m || []);
        }
      });
    }
  }, [selectedUnitId]);

  const handleSave = async () => {
    if (!selectedUnitId) return;
    try {
      setIsSaving(true);
      await api.notes.save(selectedUnitId, {
        content,
        important_points: importantPoints,
        key_terms: keyTerms,
        questions_2m: q2m,
        questions_5m: q5m,
        questions_10m: q10m
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to save notes');
    } finally {
      setIsSaving(false);
    }
  };

  const addPoint = () => {
    if (!newPoint.trim()) return;
    setImportantPoints([...importantPoints, newPoint.trim()]);
    setNewPoint('');
  };

  const addKeyTerm = () => {
    if (!newTerm.trim()) return;
    setKeyTerms([...keyTerms, { term: newTerm.trim(), definition: newDef.trim() }]);
    setNewTerm('');
    setNewDef('');
  };

  const addQ2m = () => {
    if (!newQ2m.trim()) return;
    setQ2m([...q2m, newQ2m.trim()]);
    setNewQ2m('');
  };

  const addQ5m = () => {
    if (!newQ5m.trim()) return;
    setQ5m([...q5m, newQ5m.trim()]);
    setNewQ5m('');
  };

  const addQ10m = () => {
    if (!newQ10m.trim()) return;
    setQ10m([...q10m, newQ10m.trim()]);
    setNewQ10m('');
  };

  const activeUnit = units.find((u) => u.id === selectedUnitId);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-400" />
            <span>Unit Notes & University Exam Questions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Store essential formulas, key definitions, and 2-mark, 5-mark, and 10-mark university questions for quick active recall during Day 4 and Day 7 revisions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedUnitId && (
            <button
              onClick={() => onOpenAI(selectedUnitId)}
              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>AI Question Gen</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || !selectedUnitId}
            className={`btn btn-primary text-xs py-2 px-4 flex items-center gap-1.5 ${
              saveSuccess ? 'bg-emerald-600 border-emerald-500' : ''
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="font-semibold text-slate-300 block mb-1">Select Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
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
          <label className="font-semibold text-slate-300 block mb-1">Select Unit / Chapter</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="input-field text-xs py-2"
            disabled={units.length === 0}
          >
            {units.length === 0 ? (
              <option value="">No units in this subject</option>
            ) : (
              units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}: {u.name}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {activeUnit && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Comprehensive Notes & Important Points */}
          <div className="lg:col-span-7 space-y-6">
            {/* Core Notes Textarea */}
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <h3 className="font-bold text-white text-sm">
                    {activeUnit.unit_number} Comprehensive Notes
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Displayed during revisions
                </span>
              </div>

              <textarea
                rows={10}
                placeholder="Write full summary, textbook excerpts, theoretical mechanisms, and formulas here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field text-xs leading-relaxed font-sans"
              />
            </div>

            {/* Important Points List */}
            <div className="glass-panel p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Key Points & Takeaways ({importantPoints.length})</span>
                </h3>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {importantPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-slate-900/80 border border-white/5 gap-2"
                  >
                    <span className="text-slate-300 leading-relaxed">• {pt}</span>
                    <button
                      onClick={() =>
                        setImportantPoints(importantPoints.filter((_, i) => i !== idx))
                      }
                      className="text-slate-500 hover:text-rose-400 p-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add essential bullet point..."
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPoint()}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={addPoint}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Key Terms Glossary */}
            <div className="glass-panel p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Key Terms & Definitions ({keyTerms.length})</span>
                </h3>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {keyTerms.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">{item.term}</span>
                      <button
                        onClick={() => setKeyTerms(keyTerms.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {item.definition}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Term (e.g. Spatial Friction)"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  className="input-field text-xs py-1.5"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Definition / Explanation"
                    value={newDef}
                    onChange={(e) => setNewDef(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addKeyTerm()}
                    className="input-field text-xs py-1.5"
                  />
                  <button
                    type="button"
                    onClick={addKeyTerm}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: University Exam Questions Repository */}
          <div className="lg:col-span-5 space-y-6 text-xs">
            {/* 2-Mark Questions */}
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>2-Mark Questions (Short / Definitions)</span>
                </h3>
                <span className="badge text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {q2m.length} Questions
                </span>
              </div>

              <ol className="list-decimal list-inside space-y-2 max-h-40 overflow-y-auto">
                {q2m.map((q, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-slate-900/80 border border-white/5 gap-2 text-slate-200"
                  >
                    <span>{q}</span>
                    <button
                      onClick={() => setQ2m(q2m.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 p-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. Define Regional Economics according to Hoover..."
                  value={newQ2m}
                  onChange={(e) => setNewQ2m(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQ2m()}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={addQ2m}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 5-Mark Questions */}
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold text-purple-300 text-sm flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>5-Mark Questions (Explanations / Differentiations)</span>
                </h3>
                <span className="badge text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {q5m.length} Questions
                </span>
              </div>

              <ol className="list-decimal list-inside space-y-2 max-h-40 overflow-y-auto">
                {q5m.map((q, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-slate-900/80 border border-white/5 gap-2 text-slate-200"
                  >
                    <span>{q}</span>
                    <button
                      onClick={() => setQ5m(q5m.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 p-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. Distinguish between administrative and planning regions..."
                  value={newQ5m}
                  onChange={(e) => setNewQ5m(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQ5m()}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={addQ5m}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 10-Mark Questions */}
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-bold text-pink-300 text-sm flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>10-Mark Questions (Comprehensive Essay Prompts)</span>
                </h3>
                <span className="badge text-[10px] bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  {q10m.length} Questions
                </span>
              </div>

              <ol className="list-decimal list-inside space-y-2 max-h-40 overflow-y-auto">
                {q10m.map((q, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between p-2 rounded-lg bg-slate-900/80 border border-white/5 gap-2 text-slate-200"
                  >
                    <span>{q}</span>
                    <button
                      onClick={() => setQ10m(q10m.filter((_, i) => i !== idx))}
                      className="text-slate-500 hover:text-rose-400 p-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ol>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. Critically examine the rationale for regional planning in India..."
                  value={newQ10m}
                  onChange={(e) => setNewQ10m(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQ10m()}
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={addQ10m}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
