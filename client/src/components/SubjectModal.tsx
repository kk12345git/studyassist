import React, { useState, useEffect } from 'react';
import { X, BookOpen, Palette, Check } from 'lucide-react';
import { Subject } from '../types';
import { api } from '../api/client';

interface SubjectModalProps {
  subject?: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#14B8A6'  // Teal
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  subject,
  isOpen,
  onClose,
  onSaved
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setDescription(subject.description || '');
      setColor(subject.color || '#6366F1');
    } else {
      setName('');
      setDescription('');
      setColor('#6366F1');
    }
    setError('');
  }, [subject, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      if (subject) {
        await api.subjects.update(subject.id, { name, description, color });
      } else {
        await api.subjects.create({ name, description, color });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {subject ? 'Edit Subject' : 'Create New Subject'}
            </h3>
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
              Subject Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Regional Economics, Cost Accounting..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Description / Course Code (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Postgraduate syllabus covering spatial planning and development..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-indigo-400" />
              <span>Subject Accent Color</span>
            </label>
            <div className="flex items-center gap-2 pt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
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
              className="btn btn-primary text-xs"
            >
              {isSubmitting ? 'Saving...' : subject ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
