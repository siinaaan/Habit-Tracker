import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { TaskItem, TaskPriority, TaskRepeatType } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: TaskItem | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  initialTask,
}) => {
  const { habits, saveTask } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('');
  const [repeatType, setRepeatType] = useState<TaskRepeatType>('None');
  const [habitId, setHabitId] = useState<string>('');
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime || '');
      setRepeatType(initialTask.repeatType);
      setHabitId(initialTask.habitId || '');
      setCompleted(initialTask.completed);
    } else {
      setTitle('');
      setDescription('');
      setCategory('General');
      setPriority('Medium');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setRepeatType('None');
      setHabitId('');
      setCompleted(false);
    }
  }, [initialTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const task: TaskItem = {
        id: initialTask ? initialTask.id : `task-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        priority,
        dueDate,
        dueTime: dueTime || undefined,
        repeatType,
        habitId: habitId || null,
        completed,
        createdDate: initialTask ? initialTask.createdDate : new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      await saveTask(task);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['General', 'Spiritual', 'Learning', 'Fitness', 'Health', 'Discipline', 'Work', 'Personal'];
  const priorities: TaskPriority[] = ['Low', 'Medium', 'High'];
  const repeatOptions: TaskRepeatType[] = ['None', 'Daily', 'Weekly', 'Custom'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? '✏️ Edit Task' : '➕ Add New Task'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title (Required) */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Task Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete System Architecture Review"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context or notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
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
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date & Due Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Due Date
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Due Time (Optional)
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Repeat & Associated Habit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Repeat Option
            </label>
            <select
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value as TaskRepeatType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              {repeatOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Link to Habit (Optional)
            </label>
            <select
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="">-- No Linked Habit --</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.icon} {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Completion Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="taskCompletedCheck"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="taskCompletedCheck" className="text-xs font-bold text-slate-200 cursor-pointer">
            Mark task as completed
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : initialTask ? 'Save Task' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
