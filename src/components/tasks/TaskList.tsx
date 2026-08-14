import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { TaskItem } from '../../types';
import { TaskModal } from './TaskModal';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { EmptyState } from '../ui/EmptyState';
import { CheckSquare, Square, Edit2, Trash2, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export const TaskList: React.FC = () => {
  const { tasks, toggleTaskCompleted, deleteTask } = useApp();

  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Low: 'bg-slate-500/10 text-slate-400 border-slate-700',
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-indigo-400" />}
          title="No Tasks Yet"
          description="Create your first task to start tracking actionable to-dos alongside your habits."
        />
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={clsx(
                'flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3',
                task.completed
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )}
            >
              {/* Left: Checkbox & Info */}
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => toggleTaskCompleted(task.id)}
                  className="mt-0.5 sm:mt-0 p-1 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {task.completed ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={clsx(
                        'font-bold text-sm transition-colors',
                        task.completed ? 'text-slate-400 line-through' : 'text-slate-100'
                      )}
                    >
                      {task.title}
                    </h4>

                    <span
                      className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        priorityColors[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>

                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                      {task.category}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" /> {task.dueDate}
                    </span>
                    {task.dueTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" /> {task.dueTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
                <button
                  onClick={() => setEditingTask(task)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Edit task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingId(task.id)}
                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Edit Modal */}
      {editingTask && (
        <TaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          initialTask={editingTask}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteTask(deletingId);
        }}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
      />
    </div>
  );
};
