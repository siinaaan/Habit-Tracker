import React, { useState, useEffect } from 'react';
import type { Habit, HabitCategory, HabitType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Habit) => void;
  initialHabit?: Habit | null;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Learning');
  const [icon, setIcon] = useState('⚡');
  const [type, setType] = useState<HabitType>('checkbox');
  const [target, setTarget] = useState<number>(1);
  const [unit, setUnit] = useState('bool');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setDescription(initialHabit.description);
      setCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setType(initialHabit.type);
      setTarget(initialHabit.target);
      setUnit(initialHabit.unit);
    } else {
      setName('');
      setDescription('');
      setCategory('Learning');
      setIcon('⚡');
      setType('checkbox');
      setTarget(1);
      setUnit('bool');
    }
  }, [initialHabit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const habit: Habit = {
        id: initialHabit ? initialHabit.id : `habit-custom-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category,
        icon: icon || '⚡',
        type,
        target: Number(target) || 1,
        unit: unit || 'count',
        frequency: 'daily',
        active: initialHabit ? initialHabit.active : true,
        order: initialHabit ? initialHabit.order : 99,
        createdDate: initialHabit ? initialHabit.createdDate : new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      await onSave(habit);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const categories: HabitCategory[] = [
    'Spiritual',
    'Learning',
    'Health',
    'Fitness',
    'Discipline',
    'Digital Wellbeing',
    'Custom',
  ];

  const types: { id: HabitType; label: string }[] = [
    { id: 'checkbox', label: 'Checkbox (Completed / Missed)' },
    { id: 'number', label: 'Number Input (Count, Litres, Problems)' },
    { id: 'duration', label: 'Duration (Minutes)' },
    { id: 'time', label: 'Time Target (Bedtime, Wake time)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialHabit ? '✏️ Edit Habit' : '➕ Create Custom Habit'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name & Emoji Icon */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Icon
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="⚡"
              className="w-full text-center text-xl bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read 20 pages of documentation"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose or rule"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as HabitCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Input Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HabitType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Target & Unit */}
        {type !== 'checkbox' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Value
              </label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Unit (e.g. L, mins, count)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mins / L / problems"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialHabit ? 'Update Habit' : 'Create Habit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
