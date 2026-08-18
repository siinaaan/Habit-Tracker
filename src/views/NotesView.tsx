import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Note } from '../types';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteModal } from '../components/notes/NoteModal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { Button } from '../components/ui/Button';
import { StickyNote, Plus, Search, Archive, FileText } from 'lucide-react';

type NoteFilterType = 'active' | 'archived';

export const NotesView: React.FC = () => {
  const { notes, saveNote, deleteNote, toggleArchiveNote, showToast } = useApp();

  const [filterType, setFilterType] = useState<NoteFilterType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesArchive = filterType === 'archived' ? n.archived : !n.archived;
      if (!matchesArchive) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = n.content.toLowerCase().includes(q);
      return titleMatch || contentMatch;
    });
  }, [notes, filterType, searchQuery]);

  const activeCount = useMemo(() => notes.filter((n) => !n.archived).length, [notes]);
  const archivedCount = useMemo(() => notes.filter((n) => n.archived).length, [notes]);

  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    const noteTitle = deletingNote.title;
    await deleteNote(deletingNote.id);
    setDeletingNote(null);
    showToast(`Note "${noteTitle}" deleted successfully.`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-12">
      {/* Header & Main Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <StickyNote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                Personal Notes
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Capture ideas, thoughts, guidelines, and quick reference logs.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          variant="primary"
          className="flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-3 rounded-2xl">
        {/* Navigation Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setFilterType('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              filterType === 'active'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>All Notes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] border border-slate-700/50">
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setFilterType('archived')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
              filterType === 'archived'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] border border-slate-700/50">
              {archivedCount}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-xs font-medium"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleOpenEditModal}
              onArchive={(n) => toggleArchiveNote(n.id)}
              onDelete={(n) => setDeletingNote(n)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-center space-y-4 my-6">
          <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-slate-400">
            {filterType === 'archived' ? (
              <Archive className="w-8 h-8" />
            ) : (
              <StickyNote className="w-8 h-8" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-200">
              {filterType === 'archived'
                ? 'No Archived Notes'
                : searchQuery
                ? 'No Notes Found'
                : 'No Notes Yet'}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              {filterType === 'archived'
                ? 'Archived notes will appear here when you archive them from your main list.'
                : searchQuery
                ? `No notes matched your search query "${searchQuery}".`
                : 'Create your first note to start organizing your thoughts, goals, or study notes.'}
            </p>
          </div>
          {filterType === 'active' && !searchQuery && (
            <Button onClick={handleOpenCreateModal} variant="primary" className="mt-2">
              <Plus className="w-4 h-4 mr-1.5" /> Create First Note
            </Button>
          )}
        </div>
      )}

      {/* Note Create/Edit Modal */}
      <NoteModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
        }}
        onSave={saveNote}
        initialNote={editingNote}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={Boolean(deletingNote)}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={
          deletingNote
            ? `Are you sure you want to delete note "${deletingNote.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Note"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
};
