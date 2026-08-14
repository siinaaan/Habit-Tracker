import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Goal, GoalStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { Target, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export const GoalsView: React.FC = () => {
  const { goals, saveGoal, deleteGoal } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Learning');
  const [target, setTarget] = useState<number>(100);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState('problems');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 89 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<GoalStatus>('In Progress');

  // Delete state
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setCategory('Learning');
    setTarget(100);
    setCurrentValue(0);
    setUnit('problems');
    setStatus('In Progress');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description);
    setCategory(g.category);
    setTarget(g.target);
    setCurrentValue(g.currentValue);
    setUnit(g.unit);
    setStartDate(g.startDate);
    setEndDate(g.endDate);
    setStatus(g.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const calcProgress = Math.min(100, Math.round((currentValue / (target || 1)) * 100));

    const g: Goal = {
      id: editingGoal ? editingGoal.id : `goal-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      target: Number(target) || 1,
      currentValue: Number(currentValue) || 0,
      unit: unit || 'units',
      startDate,
      endDate,
      status: calcProgress >= 100 ? 'Completed' : status,
      progress: calcProgress,
      createdDate: editingGoal ? editingGoal.createdDate : new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    saveGoal(g);
    setIsModalOpen(false);
  };

  const handleQuickProgressUpdate = (goal: Goal, delta: number) => {
    const newVal = Math.max(0, goal.currentValue + delta);
    const calcProgress = Math.min(100, Math.round((newVal / (goal.target || 1)) * 100));
    saveGoal({
      ...goal,
      currentValue: newVal,
      progress: calcProgress,
      status: calcProgress >= 100 ? 'Completed' : goal.status,
    });
  };

  const filteredGoals = goals.filter((g) => {
    const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || g.category === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🎯 90-Day Challenge Goals CRUD
          </h2>
          <p className="text-xs text-slate-400">
            Define, track, and accomplish high-leverage milestones.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Create Goal
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <Filter className="w-3.5 h-3.5 text-indigo-400 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer"
          >
            <option value="ALL">Status: All Goals</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer"
          >
            <option value="ALL">Category: All Categories</option>
            <option value="Learning">Learning</option>
            <option value="Spiritual">Spiritual</option>
            <option value="Fitness">Fitness</option>
            <option value="Health">Health</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="No Goals Found"
          description="Create your first 90-day mastery goal to start tracking target milestones."
          actionText="Create Goal"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((g) => (
            <Card key={g.id} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                      {g.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">{g.title}</h3>
                  </div>

                  <span
                    className={clsx(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      g.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : g.status === 'In Progress'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {g.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-4">{g.description}</p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>Target Progress</span>
                    <span>
                      {g.currentValue} / {g.target} {g.unit} ({g.progress}%)
                    </span>
                  </div>
                  <ProgressBar progress={g.progress} color="gradient" height="md" />
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickProgressUpdate(g, 1)}
                    className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 cursor-pointer"
                  >
                    +1 {g.unit}
                  </button>
                  <button
                    onClick={() => handleQuickProgressUpdate(g, 5)}
                    className="px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 cursor-pointer"
                  >
                    +5 {g.unit}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(g)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingGoalId(g.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGoal ? '✏️ Edit Goal' : '🎯 Create New Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve 150 LeetCode Medium/Hard Problems"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key target details and why this goal matters"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Learning / Fitness"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="problems / hours"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Value
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Current Value
              </label>
              <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingGoalId}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={() => {
          if (deletingGoalId) deleteGoal(deletingGoalId);
        }}
        title="Delete Goal"
        message="Are you sure you want to delete this goal?"
      />
    </div>
  );
};
