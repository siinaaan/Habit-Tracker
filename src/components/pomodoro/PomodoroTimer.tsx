import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Plus,
  Coffee,
  Brain,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export const PomodoroTimer: React.FC = () => {
  const { settings, updateHabitLog, triggerConfetti, showToast, logs } = useApp();
  const pomodoroSettings = settings.pomodoroSettings;

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(pomodoroSettings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [manualCount, setManualCount] = useState<number>(1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync mode duration whenever settings or mode change
  useEffect(() => {
    let durationMins = pomodoroSettings.focusDuration;
    if (mode === 'shortBreak') durationMins = pomodoroSettings.shortBreakDuration;
    if (mode === 'longBreak') durationMins = pomodoroSettings.longBreakDuration;
    setTimeLeft(durationMins * 60);
    setIsRunning(false);
  }, [mode, pomodoroSettings]);

  // Audio chime synthesizer via Web Audio API (No external asset needed!)
  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

  // Timer Tick interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playChimeSound();

    if (mode === 'focus') {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);

      // Auto record session to habit log for pomodoro
      const currentLog = logs.find((l) => l.habitId === 'habit-pomodoro');
      const currentSessions = currentLog?.numericValue ?? 0;
      updateHabitLog('habit-pomodoro', {
        numericValue: currentSessions + 1,
        completed: currentSessions + 1 >= 4,
      });

      triggerConfetti();
      showToast('🎉 Focus session completed! Time for a well-deserved break.', 'success');

      // Auto switch to break
      if (newCount % pomodoroSettings.longBreakInterval === 0) {
        setMode('longBreak');
      } else {
        setMode('shortBreak');
      }
    } else {
      showToast('☕ Break finished! Ready for the next deep work sprint?', 'info');
      setMode('focus');
    }
  };

  const toggleStart = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    let durationMins = pomodoroSettings.focusDuration;
    if (mode === 'shortBreak') durationMins = pomodoroSettings.shortBreakDuration;
    if (mode === 'longBreak') durationMins = pomodoroSettings.longBreakDuration;
    setTimeLeft(durationMins * 60);
  };

  const skipTimer = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const handleManualEntry = () => {
    if (manualCount <= 0) return;
    const currentLog = logs.find((l) => l.habitId === 'habit-pomodoro');
    const currentSessions = currentLog?.numericValue ?? 0;
    const updatedCount = currentSessions + manualCount;

    updateHabitLog('habit-pomodoro', {
      numericValue: updatedCount,
      completed: updatedCount >= 4,
    });

    showToast(`Logged +${manualCount} manual Pomodoro session(s)!`, 'success');
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

  const todayPomodoros = logs
    .filter((l) => l.habitId === 'habit-pomodoro')
    .pop()?.numericValue || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Title & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🍅 Deep Work Pomodoro System
          </h2>
          <p className="text-xs text-slate-400">
            Structured focus intervals aligned with your 90-day mastery goals.
          </p>
        </div>

        {/* Mode Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setMode('focus')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5',
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Brain className="w-3.5 h-3.5" />
            Focus ({pomodoroSettings.focusDuration}m)
          </button>
          <button
            onClick={() => setMode('shortBreak')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5',
              mode === 'shortBreak'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Coffee className="w-3.5 h-3.5" />
            Short Break ({pomodoroSettings.shortBreakDuration}m)
          </button>
          <button
            onClick={() => setMode('longBreak')}
            className={clsx(
              'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5',
              mode === 'longBreak'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Coffee className="w-3.5 h-3.5" />
            Long Break ({pomodoroSettings.longBreakDuration}m)
          </button>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <Card className="text-center py-10 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-slate-800">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold uppercase tracking-widest text-indigo-400">
            {mode === 'focus' && '🔥 Deep Focus Sprint'}
            {mode === 'shortBreak' && '☕ Coffee / Rest Break'}
            {mode === 'longBreak' && '🧘 Extended Restoration'}
          </span>

          <div className="text-6xl sm:text-8xl font-black tracking-tight font-mono text-white glow-indigo py-2">
            {formatTime(timeLeft)}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              size="lg"
              variant={isRunning ? 'secondary' : 'primary'}
              onClick={toggleStart}
              icon={isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              className="px-8 py-4 text-lg"
            >
              {isRunning ? 'Pause' : 'Start Focus'}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
              icon={<RotateCcw className="w-5 h-5" />}
            >
              Reset
            </Button>

            <Button
              size="lg"
              variant="ghost"
              onClick={skipTimer}
              icon={<SkipForward className="w-5 h-5" />}
            >
              Skip
            </Button>
          </div>
        </div>
      </Card>

      {/* Bottom Grid: Stats & Schedule Reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Session Telemetry & Manual Entry */}
        <Card>
          <CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Pomodoro Telemetry
          </CardTitle>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Today's Sessions</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{todayPomodoros} / 4</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Lifetime</p>
              <p className="text-2xl font-black text-indigo-400 mt-1">{totalLoggedSessions} sessions</p>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="pt-4 border-t border-slate-800/80">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Manual Session Logging
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="10"
                value={manualCount}
                onChange={(e) => setManualCount(parseInt(e.target.value, 10) || 1)}
                className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 font-bold"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleManualEntry}
                icon={<Plus className="w-4 h-4" />}
              >
                Log +{manualCount} Session(s)
              </Button>
            </div>
          </div>
        </Card>

        {/* Daily Schedule Reference Guide */}
        <Card>
          <CardTitle>
            <Clock className="w-5 h-5 text-amber-400" /> Daily Target Schedule
          </CardTitle>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">09:30 AM – 11:00 AM</span>
              <span className="text-slate-300 font-medium">Sprint 1: Deep Code / LeetCode</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span className="font-bold">11:00 AM – 11:20 AM</span>
              <span className="font-semibold">☕ Coffee & Hydration Break</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">11:20 AM – 01:15 PM</span>
              <span className="text-slate-300 font-medium">Sprint 2: Architecture & System Design</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <span className="font-bold">01:15 PM – 02:10 PM</span>
              <span className="font-semibold">🍲 40m Lunch & Dhuhr Break</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/60">
              <span className="font-bold text-indigo-300">02:10 PM – 04:30 PM</span>
              <span className="text-slate-300 font-medium">Sprint 3: Execution & Code Reviews</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
