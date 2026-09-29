import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  HelpCircle,
  Copy,
  Check,
  Brain,
  Layers,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';
import { Subject, Unit } from '../types';

interface AIModalProps {
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
  selectedUnitId?: string;
}

export const AIModal: React.FC<AIModalProps> = ({
  subjects,
  isOpen,
  onClose,
  selectedUnitId
}) => {
  if (!isOpen) return null;

  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string>(selectedUnitId || '');
  const [activeTab, setActiveTab] = useState<'questions' | 'summary' | 'weak'>('questions');

  const [loading, setLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [weakTopics, setWeakTopics] = useState<any[]>([]);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Load all units across subjects
  useEffect(() => {
    async function loadUnits() {
      const unitsList: Unit[] = [];
      for (const s of subjects) {
        const uList = await api.units.listBySubject(s.id);
        unitsList.push(...uList);
      }
      setAllUnits(unitsList);
      if (!activeUnitId && unitsList.length > 0) {
        setActiveUnitId(unitsList[0].id);
      }
    }
    loadUnits();
  }, [subjects]);

  // Load weak topics analysis
  useEffect(() => {
    api.ai.getWeakTopics().then((res) => {
      setWeakTopics(res.topics || []);
    });
  }, [isOpen]);

  const handleGenerateQuestions = async () => {
    if (!activeUnitId) return;
    try {
      setLoading(true);
      const res = await api.ai.generateQuestions(activeUnitId);
      setGeneratedData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeUnitId) return;
    try {
      setLoading(true);
      const res = await api.ai.generateSummary(activeUnitId);
      setSummaryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-gradient-to-r from-indigo-900/50 via-slate-900 to-pink-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Study & Exam Assistant</span>
                <span className="badge badge-primary text-[10px]">Ready</span>
              </h3>
              <p className="text-xs text-slate-400">
                10-Question Generator (MCQs, 2M, 5M, 10M), Flashcards & Weak Topic Analysis
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Revision Questions</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'summary'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Summary & Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('weak')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'weak'
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Weak Topics ({weakTopics.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab !== 'weak' && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-white/10">
              <label className="font-semibold text-slate-300 shrink-0">Select Unit:</label>
              <select
                value={activeUnitId}
                onChange={(e) => setActiveUnitId(e.target.value)}
                className="input-field text-xs py-1.5 flex-1"
              >
                {allUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number}: {u.name}
                  </option>
                ))}
              </select>

              <button
                onClick={activeTab === 'questions' ? handleGenerateQuestions : handleGenerateSummary}
                disabled={loading || !activeUnitId}
                className="btn btn-primary btn-sm flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{loading ? 'Synthesizing...' : 'Generate'}</span>
              </button>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {!generatedData ? (
                <div className="text-center py-10 text-slate-500">
                  <Brain className="h-10 w-10 mx-auto mb-2 opacity-30 text-indigo-400" />
                  <p>Click "Generate" to synthesize university exam questions for this unit.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Creates MCQs, 2-mark definitions, 5-mark explanations, and 10-mark essay prompts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* MCQs */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between font-bold text-indigo-300 text-sm">
                      <span>Multiple Choice Questions (Active Recall)</span>
                    </div>

                    <div className="space-y-3">
                      {generatedData.mcqs?.map((m: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-2">
                          <div className="font-medium text-slate-200">
                            Q{idx + 1}. {m.question}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                            {m.options.map((opt: string, oIdx: number) => (
                              <div
                                key={oIdx}
                                className={`p-1.5 rounded text-[11px] border ${
                                  oIdx === m.correctIndex
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold'
                                    : 'bg-slate-900 border-white/5 text-slate-400'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt}
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] text-slate-400 italic bg-white/5 p-1.5 rounded">
                            💡 Explanation: {m.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2-Mark Questions */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between font-bold text-amber-300 text-sm">
                      <span>2-Mark Conceptual Definitions (University Exam)</span>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedData.twoMarkQuestions?.join('\n'), '2m')
                        }
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedSection === '2m' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      {generatedData.twoMarkQuestions?.map((q: string, idx: number) => (
                        <li key={idx} className="p-1.5 rounded hover:bg-white/5">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 5-Mark Questions */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between font-bold text-purple-300 text-sm">
                      <span>5-Mark Short Notes & Analysis</span>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedData.fiveMarkQuestions?.join('\n'), '5m')
                        }
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedSection === '5m' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      {generatedData.fiveMarkQuestions?.map((q: string, idx: number) => (
                        <li key={idx} className="p-1.5 rounded hover:bg-white/5">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* 10-Mark Questions */}
                  <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                    <div className="flex items-center justify-between font-bold text-pink-300 text-sm">
                      <span>10-Mark Comprehensive Essay Prompts</span>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedData.tenMarkQuestions?.join('\n'), '10m')
                        }
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedSection === '10m' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      {generatedData.tenMarkQuestions?.map((q: string, idx: number) => (
                        <li key={idx} className="p-1.5 rounded hover:bg-white/5">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary & Flashcards Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              {!summaryData ? (
                <div className="text-center py-10 text-slate-500">
                  <Layers className="h-10 w-10 mx-auto mb-2 opacity-30 text-indigo-400" />
                  <p>Click "Generate" to synthesize flashcards and core takeaways.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Overview */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                    <div className="font-bold text-white text-sm">{summaryData.title}</div>
                    <p className="text-slate-300 leading-relaxed">{summaryData.overview}</p>

                    <div className="pt-2 border-t border-white/10">
                      <div className="font-semibold text-indigo-300 mb-1">Key Takeaways:</div>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {summaryData.keyTakeaways?.map((t: string, idx: number) => (
                          <li key={idx}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Flashcards */}
                  <div className="space-y-2">
                    <div className="font-bold text-white text-sm">Interactive Flashcards</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {summaryData.flashcards?.map((card: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-white/10 bg-slate-900/80 flex flex-col justify-between space-y-2"
                        >
                          <div className="font-semibold text-indigo-200">
                            Q: {card.front}
                          </div>
                          <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-slate-300 text-[11px]">
                            A: {card.back}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Weak Topics Tab */}
          {activeTab === 'weak' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200">
                🔍 <strong>Intelligent Weak Topic Detection:</strong> Identifies units where your revision performance was marked "Difficult" or "Average" so you can prioritize them before exam day.
              </div>

              {weakTopics.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Check className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <p>All recorded revisions have been rated "Good" or "Excellent"!</p>
                </div>
              ) : (
                weakTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/10 bg-slate-900/80 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] text-slate-400">{topic.subject_name}</span>
                        <h4 className="font-bold text-white text-sm">
                          {topic.unit_number}: {topic.unit_name}
                        </h4>
                      </div>
                      <span
                        className={`badge ${
                          topic.severity === 'High' ? 'badge-overdue' : 'badge-primary'
                        }`}
                      >
                        {topic.severity} Priority
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-500/20">
                      💡 {topic.recommendedAction}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
