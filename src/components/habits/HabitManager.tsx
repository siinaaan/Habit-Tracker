import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Habit } from '../../types';
import { HabitModal } from './HabitModal';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Button } from '../ui/Button';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export const HabitManager: React.FC = () => {
  const { habits, saveHabit, saveHabitsOrder, deleteHabit } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Confirmation Delete state
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const categories = [
    'ALL',
    'Spiritual',
    'Learning',
    'Health',
    'Fitness',
    'Discipline',
    'Digital Wellbeing',
    'Custom',
  ];

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const handleToggleActive = (habit: Habit) => {
    saveHabit({
      ...habit,
      active: !habit.active,
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newHabits = [...habits];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newHabits.length) return;

    const temp = newHabits[index];
    newHabits[index] = newHabits[targetIdx];
    newHabits[targetIdx] = temp;

    // Update order values
    const ordered = newHabits.map((h, i) => ({ ...h, order: i + 1 }));
    saveHabitsOrder(ordered);
  };

  const filteredHabits = habits.filter((h) => {
    const matchesSearch =
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || h.category === categoryFilter;
    const matchesActive =
      activeFilter === 'ALL' ||
      (activeFilter === 'ACTIVE' && h.active) ||
      (activeFilter === 'INACTIVE' && !h.active);

    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            ⚙️ Habit Management CRUD
          </h2>
          <p className="text-xs text-slate-400">
            Create, edit, reorder, or toggle habits for your 90-day challenge.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Custom Habit
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search habits..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400 mr-2 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Active/Inactive Filter */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
          >
            <option value="ALL">Status: All Habits</option>
            <option value="ACTIVE">Status: Active Only</option>
            <option value="INACTIVE">Status: Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {filteredHabits.map((habit, index) => (
          <div
            key={habit.id}
            className={clsx(
              'flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3',
              habit.active
                ? 'bg-slate-900/60 border-slate-800/80'
                : 'bg-slate-900/20 border-slate-800/40 opacity-60'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                {habit.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-100">{habit.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                    {habit.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {habit.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{habit.description}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
              {/* Active Toggle */}
              <button
                onClick={() => handleToggleActive(habit)}
                className={clsx(
                  'px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border',
                  habit.active
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                )}
              >
                {habit.active ? 'Active' : 'Disabled'}
              </button>

              {/* Reorder up/down */}
              <div className="flex items-center gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === filteredHabits.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Edit */}
              <button
                onClick={() => handleOpenEdit(habit)}
                className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-pointer"
                title="Edit habit"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => setDeletingHabitId(habit.id)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                title="Delete habit"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={saveHabit}
        initialHabit={editingHabit}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={!!deletingHabitId}
        onClose={() => setDeletingHabitId(null)}
        onConfirm={() => {
          if (deletingHabitId) deleteHabit(deletingHabitId);
        }}
        title="Delete Habit"
        message="Are you sure you want to delete this habit? All habit log history associated with it will remain stored."
      />
    </div>
  );
};
