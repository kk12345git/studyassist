import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { api } from '../api/client';
import { Subject } from '../types';

interface HistoryViewProps {
  subjects: Subject[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ subjects }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.history.list(
        selectedSubjectId || undefined,
        selectedType !== 'all' ? selectedType : undefined
      );
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedSubjectId, selectedType]);

  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.subject_name?.toLowerCase().includes(q) ||
      item.unit_name?.toLowerCase().includes(q) ||
      item.unit_number?.toLowerCase().includes(q) ||
      item.session_type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Clock className="h-6 w-6 text-indigo-400" />
          <span>Study & Revision History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Auditable log of every Day 1 study session, Day 4 revision, and Day 7 final revision.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search subject, unit, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="input-field py-2 text-xs flex-1 sm:w-44"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Session Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input-field py-2 text-xs flex-1 sm:w-36"
          >
            <option value="all">All Sessions</option>
            <option value="study">Day 1 Study</option>
            <option value="revision">Revisions (4 & 7)</option>
          </select>
        </div>
      </div>

      {/* History Table & Cards */}
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            Loading session history...
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs space-y-1">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>No study or revision history records found.</p>
            <p className="text-[11px] text-slate-600">
              Complete your first Day 1 study session to see logs appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-white/5 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Unit / Chapter</th>
                  <th className="py-3.5 px-4">Session Type</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Performance</th>
                  <th className="py-3.5 px-4">Status / Punctuality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredHistory.map((item, idx) => {
                  const isDay1 = item.session_type === 'Day 1 Study';
                  const isDay4 = item.session_type === 'Day 4 Revision';
                  const isDay7 = item.session_type === 'Day 7 Revision';

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="font-semibold text-white px-2 py-0.5 rounded text-[11px]"
                          style={{
                            backgroundColor: `${item.subject_color || '#6366F1'}20`,
                            color: item.subject_color || '#818CF8'
                          }}
                        >
                          {item.subject_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {item.unit_number}: {item.unit_name}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`badge text-[10px] ${
                            isDay1
                              ? 'badge-day1'
                              : isDay4
                              ? 'badge-day4'
                              : 'badge-day7'
                          }`}
                        >
                          {item.session_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {item.duration_minutes} mins
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.performance ? (
                          <span
                            className={`badge text-[10px] ${
                              item.performance === 'Excellent'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : item.performance === 'Good'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : item.performance === 'Average'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {item.performance === 'Excellent' && '🔥 '}
                            {item.performance === 'Good' && '🙂 '}
                            {item.performance === 'Average' && '😐 '}
                            {item.performance === 'Difficult' && '😟 '}
                            {item.performance}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.days_late > 0 ? (
                          <span className="text-amber-400 font-medium text-[11px]">
                            ⚠️ {item.days_late}d late
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>On Time</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
