import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Timer, Sun, Moon, Calendar as CalendarIcon, Flame } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeChallenge,
    currentDayNumber,
    selectedDate,
    setSelectedDate,
    settings,
    updateSettings,
    setActiveTab,
    resetToNewChallenge,
  } = useApp();

  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({
      ...settings,
      theme: isDark ? 'light' : 'dark',
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight text-white flex items-center gap-2">
              90 DAYS <span className="text-orange-500">LIFE UPGRADE</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              {activeChallenge?.name || 'Personal Growth Tracker'}
            </p>
          </div>
        </div>

        {/* Center: Current Day Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 flex items-center gap-2 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Day {currentDayNumber} <span className="text-slate-500">/ 90</span>
            </span>
          </div>

          {/* Quick Date Selector */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-300">
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Pomodoro Launcher */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setActiveTab('pomodoro')}
            icon={<Timer className="w-4 h-4 text-orange-400" />}
            className="hidden sm:inline-flex"
          >
            Pomodoro
          </Button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle dark/light mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {settings.isDemoMode && (
        <div className="mt-2 py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/20 to-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded text-[10px]">
              Demo Mode
            </span>
            <span className="hidden sm:inline">Preloaded 7-day realistic metrics. Ready to start your real journey?</span>
          </div>
          <button
            onClick={() => resetToNewChallenge('90-Day Personal Upgrade')}
            className="font-bold text-amber-200 hover:text-white underline cursor-pointer hover:scale-105 transition-transform"
          >
            Clear Demo Data & Start Challenge
          </button>
        </div>
      )}
    </header>
  );
};
