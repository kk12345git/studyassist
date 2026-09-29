import React, { useState, useEffect } from 'react';
import { X, Layers, Clock } from 'lucide-react';
import { Unit, Difficulty } from '../types';
import { api } from '../api/client';

interface UnitModalProps {
  subjectId: string;
  subjectName: string;
  unit?: Unit | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  subjectId,
  subjectName,
  unit,
  isOpen,
  onClose,
  onSaved
}) => {
  if (!isOpen) return null;

  const [unitNumber, setUnitNumber] = useState('Unit I');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unit_number);
      setName(unit.name);
      setDescription(unit.description || '');
      setDifficulty(unit.difficulty);
      setEstimatedMinutes(unit.estimated_minutes);
    } else {
      setUnitNumber('Unit I');
      setName('');
      setDescription('');
      setDifficulty('Medium');
      setEstimatedMinutes(60);
    }
    setError('');
  }, [unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setError('Unit number is required (e.g. Unit I)');
      return;
    }
    if (!name.trim()) {
      setError('Unit name cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);
      if (unit) {
        await api.units.update(unit.id, {
          unit_number: unitNumber,
          name,
          description,
          difficulty,
          estimated_minutes: estimatedMinutes
        });
      } else {
        await api.units.create(subjectId, {
          unit_number: unitNumber,
          name,
          description,
          difficulty,
          estimated_minutes: estimatedMinutes
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save unit');
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
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {unit ? 'Edit Unit / Chapter' : 'Add Unit to ' + subjectName}
              </h3>
              <p className="text-[11px] text-slate-400">Spaced repetition schedule begins when studied</p>
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
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Unit # <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Unit I"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="input-field text-xs py-2"
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label className="font-semibold text-slate-300 block mb-1">
                Unit / Chapter Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Introduction to Regional Economics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-xs py-2"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Description / Topics Covered
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Administrative regions, planning regions, agro-climatic zones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="input-field text-xs py-2"
              >
                <option value="Easy">🟢 Easy</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Hard">🔴 Hard</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-400" />
                <span>Est. Time (Mins)</span>
              </label>
              <input
                type="number"
                min="10"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="input-field text-xs py-2"
              />
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
              {isSubmitting ? 'Saving...' : unit ? 'Save Changes' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
