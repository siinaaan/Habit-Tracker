import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { BreakGames } from './games/BreakGames';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Minus,
  Coffee,
  Brain,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

const STORAGE_KEY = 'life_upgrade_pomodoro_timer_state';

interface SavedTimerState {
  mode: PomodoroMode;
  isRunning: boolean;
  endTime: number | null;
  pausedTimeLeft: number;
  sessionCount: number;
}

export const PomodoroTimer: React.FC = () => {
  const { settings, updateHabitLog, triggerConfetti, showToast, logs, selectedDayLogs } = useApp();
  const pomodoroSettings = settings.pomodoroSettings;

  const getDurationForMode = useCallback(
    (m: PomodoroMode): number => {
      if (m === 'shortBreak') return pomodoroSettings.shortBreakDuration * 60;
      if (m === 'longBreak') return pomodoroSettings.longBreakDuration * 60;
      return pomodoroSettings.focusDuration * 60;
    },
    [pomodoroSettings]
  );

  // Initialize state from local storage or fallback to defaults
  const [mode, setMode] = useState<PomodoroMode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedTimerState = JSON.parse(raw);
        if (parsed && parsed.mode) return parsed.mode;
      }
    } catch {}
    return 'focus';
  });

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedTimerState = JSON.parse(raw);
        if (parsed && typeof parsed.isRunning === 'boolean') {
          if (parsed.isRunning && parsed.endTime && parsed.endTime <= Date.now()) {
            return false;
          }
          return parsed.isRunning;
        }
      }
    } catch {}
    return false;
  });

  const [endTime, setEndTime] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedTimerState = JSON.parse(raw);
        if (parsed && parsed.endTime) {
          if (parsed.endTime <= Date.now()) return null;
          return parsed.endTime;
        }
      }
    } catch {}
    return null;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedTimerState = JSON.parse(raw);
        if (parsed) {
          if (parsed.isRunning && parsed.endTime) {
            const rem = Math.max(0, Math.ceil((parsed.endTime - Date.now()) / 1000));
            return rem;
          }
          if (typeof parsed.pausedTimeLeft === 'number' && parsed.pausedTimeLeft > 0) {
            return parsed.pausedTimeLeft;
          }
        }
      }
    } catch {}
    return pomodoroSettings.focusDuration * 60;
  });

  const [sessionCount, setSessionCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: SavedTimerState = JSON.parse(raw);
        if (parsed && typeof parsed.sessionCount === 'number') return parsed.sessionCount;
      }
    } catch {}
    return 0;
  });

  const [manualCount, setManualCount] = useState<number>(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedRef = useRef<boolean>(false);

  // Helper to persist timer state
  const saveState = useCallback(
    (
      newMode: PomodoroMode,
      newRunning: boolean,
      newEndTime: number | null,
      newTimeLeft: number,
      newSessions: number
    ) => {
      try {
        const payload: SavedTimerState = {
          mode: newMode,
          isRunning: newRunning,
          endTime: newEndTime,
          pausedTimeLeft: newTimeLeft,
          sessionCount: newSessions,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.error('Failed to save pomodoro timer state:', err);
      }
    },
    []
  );

  // Audio chime synthesizer via Web Audio API
  const playChimeSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio fallback
    }
  };

  // Browser Desktop Notification
  const sendBrowserNotification = (title: string, body: string) => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '🍅',
        });
      }
    } catch {
      // Fallback silently if notification construction fails
    }
  };

  // Handle Session Completion
  const handleTimerComplete = useCallback(
    (currentMode: PomodoroMode, currentSessions: number) => {
      if (hasNotifiedRef.current) return;
      hasNotifiedRef.current = true;

      setIsRunning(false);
      setEndTime(null);
      playChimeSound();

      if (currentMode === 'focus') {
        const newCount = currentSessions + 1;
        setSessionCount(newCount);

        // Auto record session to habit log for today
        const todayLog = selectedDayLogs.find((l) => l.habitId === 'habit-pomodoro');
        const existingSessions = todayLog?.numericValue ?? 0;
        const updatedTotal = existingSessions + 1;

        updateHabitLog('habit-pomodoro', {
          numericValue: updatedTotal,
          completed: updatedTotal >= 4,
        });

        triggerConfetti();
        showToast('🎉 Focus session completed! Time for a well-deserved break.', 'success');
        sendBrowserNotification(
          'Pomodoro session complete!',
          'Great job! Time for a well-deserved break.'
        );

        // Auto switch to break
        const nextMode: PomodoroMode =
          newCount % pomodoroSettings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
        const nextDuration = getDurationForMode(nextMode);

        setMode(nextMode);
        setTimeLeft(nextDuration);
        saveState(nextMode, false, null, nextDuration, newCount);
      } else {
        showToast('☕ Break finished! Ready for the next deep work sprint?', 'info');
        sendBrowserNotification('Break time is over!', 'Ready for your next deep focus sprint?');

        const nextMode: PomodoroMode = 'focus';
        const nextDuration = getDurationForMode(nextMode);

        setMode(nextMode);
        setTimeLeft(nextDuration);
        saveState(nextMode, false, null, nextDuration, currentSessions);
      }
    },
    [
      selectedDayLogs,
      updateHabitLog,
      triggerConfetti,
      showToast,
      pomodoroSettings.longBreakInterval,
      getDurationForMode,
      saveState,
    ]
  );

  // Timer Tick Function
  const checkAndUpdateTimer = useCallback(() => {
    if (!isRunning || !endTime) return;

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
    setTimeLeft(remaining);
    saveState(mode, true, endTime, remaining, sessionCount);

    if (remaining <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleTimerComplete(mode, sessionCount);
    }
  }, [isRunning, endTime, mode, sessionCount, saveState, handleTimerComplete]);

  // Main Timer Tick Interval + Page Visibility Catchup
  useEffect(() => {
    if (isRunning && endTime) {
      hasNotifiedRef.current = false;
      checkAndUpdateTimer();

      timerRef.current = setInterval(() => {
        checkAndUpdateTimer();
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    const handleVisibilityOrFocusChange = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        checkAndUpdateTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    window.addEventListener('focus', handleVisibilityOrFocusChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
    };
  }, [isRunning, endTime, checkAndUpdateTimer]);

  // Actions
  const toggleStart = () => {
    if (!isRunning) {
      // Request Notification Permission on user click if default
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      const durationSecs = timeLeft > 0 ? timeLeft : getDurationForMode(mode);
      const newEndTime = Date.now() + durationSecs * 1000;

      hasNotifiedRef.current = false;
      setTimeLeft(durationSecs);
      setEndTime(newEndTime);
      setIsRunning(true);
      saveState(mode, true, newEndTime, durationSecs, sessionCount);
    } else {
      // Pause
      const remaining = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : timeLeft;
      setIsRunning(false);
      setEndTime(null);
      setTimeLeft(remaining);
      saveState(mode, false, null, remaining, sessionCount);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    hasNotifiedRef.current = false;
    const durationSecs = getDurationForMode(mode);
    setTimeLeft(durationSecs);
    saveState(mode, false, null, durationSecs, sessionCount);
  };

  const skipTimer = () => {
    setIsRunning(false);
    setEndTime(null);
    hasNotifiedRef.current = false;

    const nextMode: PomodoroMode = mode === 'focus' ? 'shortBreak' : 'focus';
    const durationSecs = getDurationForMode(nextMode);

    setMode(nextMode);
    setTimeLeft(durationSecs);
    saveState(nextMode, false, null, durationSecs, sessionCount);
  };

  const switchMode = (newMode: PomodoroMode) => {
    if (mode === newMode && isRunning) return;

    setIsRunning(false);
    setEndTime(null);
    hasNotifiedRef.current = false;

    const durationSecs = getDurationForMode(newMode);
    setMode(newMode);
    setTimeLeft(durationSecs);
    saveState(newMode, false, null, durationSecs, sessionCount);
  };

  const handleDecreaseManual = () => {
    setManualCount((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseManual = () => {
    setManualCount((prev) => Math.min(10, prev + 1));
  };

  const handleManualAdd = () => {
    if (manualCount <= 0) return;
    const todayLog = selectedDayLogs.find((l) => l.habitId === 'habit-pomodoro');
    const currentSessions = todayLog?.numericValue ?? 0;
    const updatedCount = currentSessions + manualCount;

    updateHabitLog('habit-pomodoro', {
      numericValue: updatedCount,
      completed: updatedCount >= 4,
    });

    showToast(`Logged +${manualCount} manual Pomodoro session(s)!`, 'success');
  };

  const handleManualSubtract = () => {
    if (manualCount <= 0) return;
    const todayLog = selectedDayLogs.find((l) => l.habitId === 'habit-pomodoro');
    const currentSessions = todayLog?.numericValue ?? 0;
    const updatedCount = Math.max(0, currentSessions - manualCount);

    updateHabitLog('habit-pomodoro', {
      numericValue: updatedCount,
      completed: updatedCount >= 4,
    });

    showToast(`Logged -${manualCount} manual Pomodoro session(s)!`, 'info');
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate total sessions from all logs
  const totalLoggedSessions = logs
    .filter((l) => l.habitId === 'habit-pomodoro')
    .reduce((acc, l) => acc + (l.numericValue || 0), 0);

  const todayLog = selectedDayLogs.find((l) => l.habitId === 'habit-pomodoro');
  const todayPomodoros = todayLog?.numericValue ?? 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
      {/* Top Title & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            🍅 Deep Work Pomodoro System
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured focus intervals aligned with your 90-day mastery goals.
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900 border border-slate-800 p-1 sm:p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => switchMode('focus')}
            className={clsx(
              'px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-h-[38px]',
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Brain className="w-3.5 h-3.5 shrink-0" />
            <span>Focus ({pomodoroSettings.focusDuration}m)</span>
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={clsx(
              'px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-h-[38px]',
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span>Short ({pomodoroSettings.shortBreakDuration}m)</span>
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={clsx(
              'px-2 py-2 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-[11px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 min-h-[38px]',
              mode === 'longBreak'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Coffee className="w-3.5 h-3.5 shrink-0" />
            <span>Long ({pomodoroSettings.longBreakDuration}m)</span>
          </button>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <Card className="text-center py-6 sm:py-10 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800 w-full">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-400">
            {mode === 'focus' && '🔥 Deep Focus Sprint'}
            {mode === 'shortBreak' && '☕ Coffee / Rest Break'}
            {mode === 'longBreak' && '🧘 Extended Restoration'}
          </span>

          <div className="text-5xl min-[380px]:text-6xl sm:text-8xl font-black tracking-tight font-mono text-white glow-indigo py-2">
            {formatTime(timeLeft)}
          </div>

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-3 sm:pt-4 w-full max-w-md mx-auto">
            <Button
              size="lg"
              variant={isRunning ? 'secondary' : 'primary'}
              onClick={toggleStart}
              icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 text-base sm:text-lg min-h-[48px] justify-center shadow-lg"
            >
              {isRunning ? 'Pause' : mode === 'focus' ? 'Start Focus' : 'Start Break'}
            </Button>

            <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                icon={<RotateCcw className="w-5 h-5" />}
                className="w-full min-h-[48px] justify-center"
              >
                Reset
              </Button>

              <Button
                size="lg"
                variant="ghost"
                onClick={skipTimer}
                icon={<SkipForward className="w-5 h-5" />}
                className="w-full min-h-[48px] justify-center"
              >
                Skip
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Break Mini-Games Section (Appears during Short or Long Break) */}
      {(mode === 'shortBreak' || mode === 'longBreak') && <BreakGames />}

      {/* Bottom Grid: Stats & Schedule Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Telemetry & Manual Entry */}
        <Card>
          <CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pomodoro Telemetry
          </CardTitle>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-4">
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Sessions</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{todayPomodoros} / 4</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Lifetime</p>
              <p className="text-xl sm:text-2xl font-black text-indigo-400 mt-1">{totalLoggedSessions} sessions</p>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="pt-4 border-t border-slate-800/80">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Manual Session Logging
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Stepper with - / Input / + */}
              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={handleDecreaseManual}
                  disabled={manualCount <= 1}
                  className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer min-w-[42px] min-h-[42px] flex items-center justify-center"
                  title="Decrease session count"
                  aria-label="Decrease session count"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min="1"
                  max="10"
                  value={manualCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setManualCount(Math.max(1, Math.min(10, val)));
                    } else {
                      setManualCount(1);
                    }
                  }}
                  className="w-12 bg-transparent text-center text-sm font-bold text-white outline-none"
                />

                <button
                  type="button"
                  onClick={handleIncreaseManual}
                  disabled={manualCount >= 10}
                  className="p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer min-w-[42px] min-h-[42px] flex items-center justify-center"
                  title="Increase session count"
                  aria-label="Increase session count"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Two Separate Log Buttons: Log -X and Log +X */}
              <div className="grid grid-cols-2 gap-2 flex-1 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualSubtract}
                  icon={<Minus className="w-4 h-4 text-rose-400" />}
                  className="w-full min-h-[42px] justify-center text-xs font-bold hover:bg-rose-500/10 hover:text-rose-300 border-slate-800"
                >
                  Log −{manualCount} Session(s)
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleManualAdd}
                  icon={<Plus className="w-4 h-4" />}
                  className="w-full min-h-[42px] justify-center text-xs font-bold"
                >
                  Log +{manualCount} Session(s)
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Daily Schedule Reference Guide */}
        <Card>
          <CardTitle>
            <Clock className="w-5 h-5 text-amber-400" /> Daily Target Schedule
          </CardTitle>

          <div className="space-y-2.5 text-xs mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">09:30 AM – 11:00 AM</span>
              <span className="text-slate-300 font-medium truncate">Sprint 1: Deep Code / LeetCode</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="font-bold">11:00 AM – 11:20 AM</span>
              <span className="font-semibold truncate">☕ Coffee & Hydration Break</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">11:20 AM – 01:15 PM</span>
              <span className="text-slate-300 font-medium truncate">Sprint 2: Architecture & System Design</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <span className="font-bold">01:15 PM – 02:10 PM</span>
              <span className="font-semibold truncate">🍲 40m Lunch & Dhuhr Break</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">02:10 PM – 04:30 PM</span>
              <span className="text-slate-300 font-medium truncate">Sprint 3: Execution & Code Reviews</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
