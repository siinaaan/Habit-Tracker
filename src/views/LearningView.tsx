import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { LearningItem, LearningStatus } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { GraduationCap, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import { clsx } from 'clsx';

export const LearningView: React.FC = () => {
  const { learningItems, saveLearningItem, deleteLearningItem } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);

  // Form state
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Computer Science');
  const [status, setStatus] = useState<LearningStatus>('In Progress');
  const [progressPercentage, setProgressPercentage] = useState<number>(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTopic('');
    setDescription('');
    setCategory('Computer Science');
    setStatus('In Progress');
    setProgressPercentage(0);
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: LearningItem) => {
    setEditingItem(item);
    setTopic(item.topic);
    setDescription(item.description);
    setCategory(item.category);
    setStatus(item.status);
    setProgressPercentage(item.progressPercentage);
    setStartDate(item.startDate);
    setTargetDate(item.targetDate);
    setNotes(item.notes);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    const item: LearningItem = {
      id: editingItem ? editingItem.id : `learning-${Date.now()}`,
      topic: topic.trim(),
      description: description.trim(),
      category: category.trim(),
      status: progressPercentage >= 100 ? 'Completed' : status,
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      startDate,
      targetDate,
      notes: notes.trim(),
      createdDate: editingItem ? editingItem.createdDate : new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    saveLearningItem(item);
    setIsModalOpen(false);
  };

  const filteredItems = learningItems.filter((i) => {
    return statusFilter === 'ALL' || i.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            📚 Self-Paced Learning Topics CRUD
          </h2>
          <p className="text-xs text-slate-400">
            Track mastery of core technical topics and skills.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Topic
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200">
          <Filter className="w-3.5 h-3.5 text-indigo-400 mr-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none cursor-pointer"
          >
            <option value="ALL">Status: All Topics</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Paused">Paused</option>
            <option value="Not Started">Not Started</option>
          </select>
        </div>
      </div>

      {/* Topics Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="w-8 h-8" />}
          title="No Learning Topics Added"
          description="Create custom learning topics to track your self-paced education during the 90 days."
          actionText="Add Topic"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-purple-400 border border-slate-700">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-100 mt-1">{item.topic}</h3>
                  </div>

                  <span
                    className={clsx(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      item.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : item.status === 'In Progress'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    )}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{item.description}</p>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs font-bold text-slate-200">
                    <span>Progress</span>
                    <span>{item.progressPercentage}%</span>
                  </div>
                  <ProgressBar progress={item.progressPercentage} color="gradient" height="md" />
                </div>

                {item.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-indigo-400">Notes:</span> {item.notes}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-semibold">
                <span className="text-slate-500 text-[10px]">
                  Target: {item.targetDate}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Edit item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? '✏️ Edit Learning Topic' : '📚 Add Learning Topic'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Distributed Systems Architecture & Kafka"
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
              placeholder="Overview of subject matter..."
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
                placeholder="Backend / AI / Systems"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LearningStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Paused">Paused</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Progress Percentage ({progressPercentage}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPercentage}
              onChange={(e) => setProgressPercentage(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Notes & Key Takeaways
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important resource links or study notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItem ? 'Update Topic' : 'Save Topic'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteLearningItem(deletingId);
        }}
        title="Delete Topic"
        message="Are you sure you want to delete this learning item?"
      />
    </div>
  );
};
