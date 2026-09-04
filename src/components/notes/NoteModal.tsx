import React, { useState, useEffect } from 'react';
import type { Note } from '../../types';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Check } from 'lucide-react';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  initialNote?: Note | null;
}

export interface NoteColorOption {
  id: string;
  name: string;
  bgClass: string;
  borderClass: string;
  pickerBgClass: string;
  badgeClass: string;
}

export const NOTE_COLOR_OPTIONS: NoteColorOption[] = [
  {
    id: 'default',
    name: 'Default',
    bgClass: 'bg-slate-900/90 hover:bg-slate-900',
    borderClass: 'border-slate-800/80 hover:border-slate-700',
    pickerBgClass: 'bg-slate-800 border-slate-600',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  {
    id: 'red',
    name: 'Red',
    bgClass: 'bg-rose-950/40 hover:bg-rose-950/60',
    borderClass: 'border-rose-800/50 hover:border-rose-600/70',
    pickerBgClass: 'bg-rose-600 border-rose-400',
    badgeClass: 'bg-rose-900/60 text-rose-200 border-rose-700/60',
  },
  {
    id: 'orange',
    name: 'Orange',
    bgClass: 'bg-amber-950/40 hover:bg-amber-950/60',
    borderClass: 'border-amber-800/50 hover:border-amber-600/70',
    pickerBgClass: 'bg-amber-500 border-amber-300',
    badgeClass: 'bg-amber-900/60 text-amber-200 border-amber-700/60',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    bgClass: 'bg-yellow-950/40 hover:bg-yellow-950/60',
    borderClass: 'border-yellow-800/50 hover:border-yellow-600/70',
    pickerBgClass: 'bg-yellow-500 border-yellow-300',
    badgeClass: 'bg-yellow-900/60 text-yellow-200 border-yellow-700/60',
  },
  {
    id: 'green',
    name: 'Green',
    bgClass: 'bg-emerald-950/40 hover:bg-emerald-950/60',
    borderClass: 'border-emerald-800/50 hover:border-emerald-600/70',
    pickerBgClass: 'bg-emerald-500 border-emerald-300',
    badgeClass: 'bg-emerald-900/60 text-emerald-200 border-emerald-700/60',
  },
  {
    id: 'blue',
    name: 'Blue',
    bgClass: 'bg-sky-950/40 hover:bg-sky-950/60',
    borderClass: 'border-sky-800/50 hover:border-sky-600/70',
    pickerBgClass: 'bg-sky-500 border-sky-300',
    badgeClass: 'bg-sky-900/60 text-sky-200 border-sky-700/60',
  },
  {
    id: 'purple',
    name: 'Purple',
    bgClass: 'bg-indigo-950/40 hover:bg-indigo-950/60',
    borderClass: 'border-indigo-800/50 hover:border-indigo-600/70',
    pickerBgClass: 'bg-indigo-500 border-indigo-300',
    badgeClass: 'bg-indigo-900/60 text-indigo-200 border-indigo-700/60',
  },
  {
    id: 'pink',
    name: 'Pink',
    bgClass: 'bg-fuchsia-950/40 hover:bg-fuchsia-950/60',
    borderClass: 'border-fuchsia-800/50 hover:border-fuchsia-600/70',
    pickerBgClass: 'bg-fuchsia-500 border-fuchsia-300',
    badgeClass: 'bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-700/60',
  },
];

export const NoteModal: React.FC<NoteModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNote,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialNote) {
      setTitle(initialNote.title);
      setContent(initialNote.content);
      setColor(initialNote.color || 'default');
    } else {
      setTitle('');
      setContent('');
      setColor('default');
    }
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isSaving) return;

    try {
      setIsSaving(true);
      const now = new Date().toISOString();
      const noteData: Note = {
        id: initialNote?.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: title.trim(),
        content: content.trim(),
        color,
        archived: initialNote ? initialNote.archived : false,
        createdDate: initialNote?.createdDate || now,
        updatedDate: now,
      };

      await onSave(noteData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <CardTitle className="text-xl font-bold text-slate-100 mb-6">
          {initialNote ? 'Edit Note' : 'Create New Note'}
        </CardTitle>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Note Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Content
            </label>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-normal resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Card Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {NOTE_COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    title={c.name}
                    aria-label={`Color ${c.name}`}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      c.pickerBgClass
                    } ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
