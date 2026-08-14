import React from 'react';
import type { Habit, HabitLog } from '../../types';
import { Check, Clock, Hash, CheckSquare } from 'lucide-react';
import { clsx } from 'clsx';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onUpdateLog: (habitId: string, logData: Partial<HabitLog>) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  onUpdateLog,
}) => {
  const isCompleted = log?.completed || false;

  const handleCheckboxToggle = () => {
    onUpdateLog(habit.id, {
      completed: !isCompleted,
    });
  };

  const handleNumberChange = (val: number) => {
    const safeVal = Math.max(0, val);
    const completed = safeVal >= habit.target;
    onUpdateLog(habit.id, {
      numericValue: safeVal,
      completed,
    });
  };

  const handleDurationChange = (val: number) => {
    const safeVal = Math.max(0, val);
    const completed = safeVal >= habit.target;
    onUpdateLog(habit.id, {
      duration: safeVal,
      completed,
    });
  };

  const handleTimeChange = (timeStr: string) => {
    onUpdateLog(habit.id, {
      timeValue: timeStr,
      completed: !!timeStr,
    });
  };

  return (
    <div
      className={clsx(
        'group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-3',
        isCompleted
          ? 'bg-slate-900/80 border-emerald-500/40 shadow-emerald-500/5'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
      )}
    >
      {/* Left: Icon & Habit Info */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
        {/* Category Icon Badge */}
        <div
          className={clsx(
            'w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-105',
            isCompleted
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-slate-800 border border-slate-700 text-slate-300'
          )}
        >
          {habit.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={clsx(
                'font-bold text-sm sm:text-base transition-colors truncate',
                isCompleted ? 'text-emerald-300 line-through' : 'text-slate-100'
              )}
            >
              {habit.name}
            </h4>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {habit.category}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {habit.description}
          </p>
        </div>
      </div>

      {/* Right: Dynamic Interactive Control */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0">
        {/* CHECKBOX TYPE */}
        {habit.type === 'checkbox' && (
          <button
            onClick={handleCheckboxToggle}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border',
              isCompleted
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            )}
          >
            <div
              className={clsx(
                'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                isCompleted
                  ? 'bg-white border-white text-emerald-600'
                  : 'border-slate-500 bg-transparent'
              )}
            >
              {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
            <span>{isCompleted ? 'Completed' : 'Check In'}</span>
          </button>
        )}

        {/* NUMBER TYPE */}
        {habit.type === 'number' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors">
              <Hash className="w-3.5 h-3.5 text-indigo-400 mr-1.5 shrink-0" />
              <input
                type="number"
                step={habit.unit === 'L' ? '0.1' : '1'}
                min="0"
                value={log?.numericValue ?? ''}
                onChange={(e) => handleNumberChange(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-16 bg-transparent text-sm font-bold text-white outline-none"
              />
              <span className="text-xs text-slate-400 font-semibold ml-1">{habit.unit}</span>
            </div>
            <button
              onClick={handleCheckboxToggle}
              className={clsx(
                'p-2 rounded-xl border transition-colors cursor-pointer',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              )}
              title="Toggle status"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* DURATION TYPE */}
        {habit.type === 'duration' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors">
              <Clock className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
              <input
                type="number"
                min="0"
                value={log?.duration ?? ''}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-16 bg-transparent text-sm font-bold text-white outline-none"
              />
              <span className="text-xs text-slate-400 font-semibold ml-1">mins</span>
            </div>
            <button
              onClick={handleCheckboxToggle}
              className={clsx(
                'p-2 rounded-xl border transition-colors cursor-pointer',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              )}
              title="Toggle status"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TIME TYPE */}
        {habit.type === 'time' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors">
              <Clock className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
              <input
                type="time"
                value={log?.timeValue ?? ''}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={handleCheckboxToggle}
              className={clsx(
                'p-2 rounded-xl border transition-colors cursor-pointer',
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              )}
              title="Toggle status"
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
