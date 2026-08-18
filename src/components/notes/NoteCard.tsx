import React from 'react';
import type { Note } from '../../types';
import { NOTE_COLOR_OPTIONS } from './NoteModal';
import { Edit3, Archive, RotateCcw, Trash2, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onArchive,
  onDelete,
}) => {
  const colorOption =
    NOTE_COLOR_OPTIONS.find((c) => c.id === note.color) || NOTE_COLOR_OPTIONS[0];

  const formatUpdatedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) return 'Updated: Today';

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) return 'Updated: Yesterday';

      return `Updated: ${date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })}`;
    } catch {
      return 'Updated: Recently';
    }
  };

  return (
    <div
      className={clsx(
        'group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        colorOption.bgClass,
        colorOption.borderClass
      )}
    >
      <div>
        {/* Header & Controls */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-base text-slate-100 line-clamp-2 leading-snug tracking-tight">
            {note.title}
          </h3>

          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => onEdit(note)}
              title="Edit Note"
              className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="Edit note"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onArchive(note)}
              title={note.archived ? 'Restore Note' : 'Archive Note'}
              className="p-1.5 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label={note.archived ? 'Restore note' : 'Archive note'}
            >
              {note.archived ? (
                <RotateCcw className="w-4 h-4 text-amber-400" />
              ) : (
                <Archive className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => onDelete(note)}
              title="Delete Note"
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition-colors"
              aria-label="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-6 mb-4 font-normal">
          {note.content}
        </p>
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/40 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatUpdatedDate(note.updatedDate)}</span>
        </div>

        {colorOption.id !== 'default' && (
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
              colorOption.badgeClass
            )}
          >
            {colorOption.name}
          </span>
        )}
      </div>
    </div>
  );
};
