import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Reflection, MoodType } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { BookOpen, Plus, Edit2, Trash2, Search, Calendar } from 'lucide-react';

export const ReflectionsView: React.FC = () => {
  const { reflections, currentDayNumber, saveReflection, deleteReflection } = useApp();

  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null);

  // Form Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accomplished, setAccomplished] = useState('');
  const [learned, setLearned] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [shouldImprove, setShouldImprove] = useState('');
  const [mood, setMood] = useState<MoodType>('⚡ Energetic');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const moods: MoodType[] = [
    '⚡ Energetic',
    '😊 Satisfied',
    '😐 Neutral',
    '😫 Tired',
    '🔥 Unstoppable',
  ];

  const handleOpenCreate = () => {
    setEditingReflection(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAccomplished('');
    setLearned('');
    setWentWell('');
    setShouldImprove('');
    setMood('⚡ Energetic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r: Reflection) => {
    setEditingReflection(r);
    setDate(r.date);
    setAccomplished(r.accomplished);
    setLearned(r.learned);
    setWentWell(r.wentWell);
    setShouldImprove(r.shouldImprove);
    setMood(r.mood);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const r: Reflection = {
      id: editingReflection ? editingReflection.id : `reflection-${Date.now()}`,
      date,
      challengeDay: editingReflection ? editingReflection.challengeDay : currentDayNumber,
      accomplished: accomplished.trim(),
      learned: learned.trim(),
      wentWell: wentWell.trim(),
      shouldImprove: shouldImprove.trim(),
      mood,
      createdDate: editingReflection ? editingReflection.createdDate : new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    saveReflection(r);
    setIsModalOpen(false);
  };

  const filteredReflections = reflections.filter((r) => {
    const search = searchTerm.toLowerCase();
    return (
      r.accomplished.toLowerCase().includes(search) ||
      r.learned.toLowerCase().includes(search) ||
      r.wentWell.toLowerCase().includes(search) ||
      r.shouldImprove.toLowerCase().includes(search) ||
      r.date.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            📝 Daily Reflections & Journaling
          </h2>
          <p className="text-xs text-slate-400">
            Document daily lessons, wins, and improvement takeaways.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Reflection
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search reflections by keywords or date..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
        />
      </div>

      {/* List of Reflections */}
      {filteredReflections.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No Reflections Yet"
          description="Reflect on your daily progress, mindsets, and key lessons."
          actionText="Add Reflection"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          {filteredReflections.map((r) => (
            <Card key={r.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-400">
                    Day {r.challengeDay}
                  </span>
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {r.date}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {r.mood}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(r)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Edit reflection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(r.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {r.accomplished && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <p className="font-bold text-emerald-400 mb-1">🎯 Accomplished</p>
                    <p className="text-slate-300 leading-relaxed">{r.accomplished}</p>
                  </div>
                )}
                {r.learned && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <p className="font-bold text-indigo-400 mb-1">💡 Key Learning</p>
                    <p className="text-slate-300 leading-relaxed">{r.learned}</p>
                  </div>
                )}
                {r.wentWell && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <p className="font-bold text-purple-400 mb-1">✨ What Went Well</p>
                    <p className="text-slate-300 leading-relaxed">{r.wentWell}</p>
                  </div>
                )}
                {r.shouldImprove && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <p className="font-bold text-amber-400 mb-1">🚀 Focus to Improve</p>
                    <p className="text-slate-300 leading-relaxed">{r.shouldImprove}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReflection ? '✏️ Edit Reflection' : '📝 Add Reflection'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Mood / Energy
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as MoodType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                {moods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              What I Accomplished
            </label>
            <textarea
              rows={2}
              value={accomplished}
              onChange={(e) => setAccomplished(e.target.value)}
              placeholder="Key tasks completed today..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              What I Learned
            </label>
            <textarea
              rows={2}
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              placeholder="Breakthroughs & insights..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                What Went Well
              </label>
              <textarea
                rows={2}
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                What to Improve
              </label>
              <textarea
                rows={2}
                value={shouldImprove}
                onChange={(e) => setShouldImprove(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingReflection ? 'Update Reflection' : 'Save Reflection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteReflection(deletingId);
        }}
        title="Delete Reflection"
        message="Are you sure you want to delete this reflection entry?"
      />
    </div>
  );
};
