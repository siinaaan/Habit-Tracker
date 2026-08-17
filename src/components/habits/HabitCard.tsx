import React, { useState, useEffect, useRef } from 'react';
import type { Habit, HabitLog } from '../../types';
import { useApp } from '../../context/AppContext';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Check, Clock, Hash, CheckSquare, Edit2, Trash2, Play, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface HabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onUpdateLog: (habitId: string, logData: Partial<HabitLog>) => void;
  isReadOnly?: boolean;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  log,
  onUpdateLog,
  isReadOnly = false,
}) => {
  const { openAddHabitModal, deleteHabit } = useApp();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const isCompleted = log?.completed || false;

  // Time-based habits detection (dynamic, works for duration, time, and newly created time habits)
  const isTimeBased = habit.type === 'duration' || habit.type === 'time';

  // Live Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setTimerSeconds(elapsed);
        } else {
          setTimerSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    if (isReadOnly) return;
    startTimeRef.current = Date.now();
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  const handleStopTimer = () => {
    if (isReadOnly) return;
    setIsTimerRunning(false);
    const now = Date.now();
    const elapsedSecs = startTimeRef.current
      ? Math.max(1, Math.round((now - startTimeRef.current) / 1000))
      : timerSeconds;

    if (elapsedSecs > 0) {
      const currentSecs = log?.duration || 0;
      const newTotalSecs = currentSecs + elapsedSecs;
      const targetInSecs = (habit.target || 0) * 60;
      const completed = newTotalSecs >= targetInSecs;

      onUpdateLog(habit.id, {
        duration: newTotalSecs,
        completed,
      });
      setTimerSeconds(0);
      startTimeRef.current = null;
    }
  };

  const formatDurationDisplay = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const parts: string[] = [];
    if (hrs > 0) parts.push(`${hrs} hour${hrs > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} minute${mins > 1 ? 's' : ''}`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);

    const textStr = parts.join(' ');
    const clockStr = `${hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return `${textStr} / ${clockStr}`;
  };

  const formatSeconds = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCheckboxToggle = () => {
    if (isReadOnly) return;
    onUpdateLog(habit.id, {
      completed: !isCompleted,
    });
  };

  const handleNumberChange = (val: number) => {
    if (isReadOnly) return;
    const safeVal = Math.max(0, val);
    const completed = safeVal >= habit.target;
    onUpdateLog(habit.id, {
      numericValue: safeVal,
      completed,
    });
  };

  const handleDurationChange = (valMins: number) => {
    if (isReadOnly) return;
    const safeMins = Math.max(0, valMins);
    const totalSecs = Math.round(safeMins * 60);
    const targetInSecs = (habit.target || 0) * 60;
    const completed = totalSecs >= targetInSecs;
    onUpdateLog(habit.id, {
      duration: totalSecs,
      completed,
    });
  };

  const handleTimeChange = (timeStr: string) => {
    if (isReadOnly) return;
    onUpdateLog(habit.id, {
      timeValue: timeStr,
      completed: !!timeStr,
    });
  };

  const savedDurationText = log?.duration ? formatDurationDisplay(log.duration) : '';

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

          {savedDurationText && (
            <p className="text-[11px] font-mono text-purple-300 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400 inline shrink-0" />
              <span>Saved: {savedDurationText}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Dynamic Interactive Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 shrink-0 w-full sm:w-auto">
        {/* TIME-BASED HABITS LIVE TIMER SYSTEM */}
        {isTimeBased ? (
          <div className="flex flex-col gap-2.5 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            {/* Action Row 1: Start/Stop Timer + Live Ticker / Duration Input */}
            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                {!isTimerRunning ? (
                  <button
                    disabled={isReadOnly}
                    onClick={handleStartTimer}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white border border-purple-500 shadow-md shadow-purple-600/30 transition-all shrink-0 min-h-[38px]",
                      isReadOnly ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    )}
                    title={isReadOnly ? "Previous day is read-only" : "Start Live Timer"}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    disabled={isReadOnly}
                    onClick={handleStopTimer}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 shadow-md shadow-rose-600/30 transition-all animate-pulse shrink-0 min-h-[38px]",
                      isReadOnly ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                    )}
                    title={isReadOnly ? "Previous day is read-only" : "Stop & Save Elapsed Time"}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                )}

                {isTimerRunning && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs shrink-0 min-h-[38px]">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>{formatSeconds(timerSeconds)}</span>
                  </div>
                )}
              </div>

              {/* DURATION TYPE MANUAL INPUT BOX */}
              {habit.type === 'duration' && (
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors shrink-0">
                  <Clock className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    value={log?.duration ? (log.duration / 60).toFixed(1).replace(/\.0$/, '') : ''}
                    onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={clsx(
                      "w-14 sm:w-16 bg-transparent text-sm font-bold text-white outline-none",
                      isReadOnly && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <span className="text-xs text-slate-400 font-semibold ml-1">mins</span>
                </div>
              )}

              {/* TIME TYPE MANUAL TIME INPUT PICKER */}
              {habit.type === 'time' && (
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 focus-within:border-indigo-500 transition-colors shrink-0">
                  <Clock className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
                  <input
                    type="time"
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    value={log?.timeValue ?? ''}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className={clsx(
                      "bg-transparent text-xs font-bold text-white outline-none",
                      isReadOnly ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    )}
                  />
                </div>
              )}
            </div>

            {/* Action Row 2: Complete Button + Edit & Delete Buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
              <button
                disabled={isReadOnly}
                onClick={handleCheckboxToggle}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border min-h-[38px]',
                  isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                )}
                title={isReadOnly ? "Previous day is read-only" : "Toggle completion status"}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded-md border flex items-center justify-center transition-colors',
                    isCompleted ? 'bg-emerald-400 border-emerald-400 text-slate-950' : 'border-slate-500 bg-transparent'
                  )}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>{isCompleted ? 'Completed' : 'Check In'}</span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openAddHabitModal(habit)}
                  className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-pointer transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Edit habit"
                  aria-label="Edit habit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                  title="Delete habit"
                  aria-label="Delete habit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FOR NON-TIME-BASED HABITS (checkbox, number) */
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            {/* CHECKBOX TYPE */}
            {habit.type === 'checkbox' && (
              <button
                disabled={isReadOnly}
                onClick={handleCheckboxToggle}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all border min-h-[38px]',
                  isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                  isCompleted
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                )}
                title={isReadOnly ? "Previous day is read-only" : "Toggle completion status"}
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
                    disabled={isReadOnly}
                    readOnly={isReadOnly}
                    value={log?.numericValue ?? ''}
                    onChange={(e) => handleNumberChange(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={clsx(
                      "w-14 sm:w-16 bg-transparent text-sm font-bold text-white outline-none",
                      isReadOnly && "opacity-60 cursor-not-allowed"
                    )}
                  />
                  <span className="text-xs text-slate-400 font-semibold ml-1">{habit.unit}</span>
                </div>
                <button
                  disabled={isReadOnly}
                  onClick={handleCheckboxToggle}
                  className={clsx(
                    'p-2 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center',
                    isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  )}
                  title={isReadOnly ? "Previous day is read-only" : "Toggle status"}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Edit & Delete Action Buttons */}
            <div className="flex items-center gap-1.5 border-l border-slate-800/80 pl-2 shrink-0">
              <button
                onClick={() => openAddHabitModal(habit)}
                className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 cursor-pointer transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Edit habit definition"
                aria-label="Edit habit definition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Delete habit definition"
                aria-label="Delete habit definition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => deleteHabit(habit.id)}
        title="Delete Habit"
        message={`Are you sure you want to delete "${habit.name}"?`}
        confirmText="Delete Habit"
      />
    </div>
  );
};
