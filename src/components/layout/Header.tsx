import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { NavigationTab } from '../../types';
import { Button } from '../ui/Button';
import { SyncStatusIndicator } from '../ui/SyncStatusIndicator';
import { GlobalSearch } from '../search/GlobalSearch';
import {
  Timer,
  Sun,
  Moon,
  Calendar as CalendarIcon,
  Flame,
  Plus,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  BarChart3,
  CalendarDays,
  TrendingUp,
  Target,
  BookOpen,
  GraduationCap,
  Trophy,
  Settings as SettingsIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Header: React.FC = () => {
  const {
    activeChallenge,
    currentDayNumber,
    selectedDate,
    setSelectedDate,
    settings,
    updateSettings,
    activeTab,
    setActiveTab,
    resetToNewChallenge,
    setIsAddHabitModalOpen,
  } = useApp();

  const { user, signOut } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const isDark = settings.theme === 'dark';

  const toggleTheme = () => {
    updateSettings({
      ...settings,
      theme: isDark ? 'light' : 'dark',
    });
  };

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'daily', label: 'Daily Tracker', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Wallet className="w-5 h-5 text-emerald-400" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5 text-indigo-400" /> },
    { id: 'calendar', label: '90-Day Calendar', icon: <CalendarDays className="w-5 h-5 text-sky-400" /> },
    { id: 'weekly', label: 'Weekly Report', icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5 text-purple-400" /> },
    { id: 'reflections', label: 'Reflections', icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
    { id: 'learning', label: 'Learning Topics', icon: <GraduationCap className="w-5 h-5 text-purple-400" /> },
    { id: 'milestones', label: 'Milestones', icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
    { id: 'pomodoro', label: 'Pomodoro Timer', icon: <Timer className="w-5 h-5 text-orange-400" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5 text-slate-400" /> },
  ];

  const handleSelectNav = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      <header className="shrink-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-6 md:px-8 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Brand / Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="hidden min-[380px]:block">
              <h1 className="text-sm sm:text-base md:text-xl font-black tracking-tight text-white flex items-center gap-1">
                90 DAYS <span className="text-orange-500 hidden sm:inline">LIFE UPGRADE</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium hidden md:block">
                {activeChallenge?.name || 'Personal Growth Tracker'}
              </p>
            </div>
          </div>

          {/* Global Search Component */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-0">
            <GlobalSearch />
          </div>

          {/* Center: Current Day Badge & Date Picker (Desktop only) */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 flex items-center gap-2 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Day {currentDayNumber} <span className="text-slate-500">/ 90</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-300">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Add Habit Button */}
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsAddHabitModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              className="px-2.5 sm:px-3 min-h-[38px]"
            >
              <span className="hidden sm:inline">Add Habit</span>
            </Button>

            {/* Sync Status Badge (Desktop only) */}
            <div className="hidden lg:block">
              <SyncStatusIndicator />
            </div>

            {/* Quick Pomodoro Launcher (Desktop only) */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setActiveTab('pomodoro')}
              icon={<Timer className="w-4 h-4 text-orange-400" />}
              className="hidden lg:inline-flex"
            >
              Pomodoro
            </Button>

            {/* Theme Toggle (Desktop only) */}
            <button
              onClick={toggleTheme}
              className="hidden lg:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle dark/light mode"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* User Account / Sign Out Button (Desktop only) */}
            {user && (
              <div className="hidden lg:flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
                <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <a
                    href={`mailto:${user.email}`}
                    title={`Send email to ${user.email}`}
                    className="max-w-[140px] truncate font-medium hover:text-indigo-300 transition-colors"
                  >
                    {user.email}
                  </a>
                </div>

                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title={`Sign out (${user.email})`}
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* More / Menu Button (Smaller screens only: mobile & tablet) */}
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Open More navigation menu"
              title="More options"
            >
              <Menu className="w-5 h-5 text-indigo-400" />
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

      {/* More Menu Popover Drawer (Mobile & Tablet) */}
      {isMoreMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          {/* Backdrop click to dismiss */}
          <div className="absolute inset-0" onClick={() => setIsMoreMenuOpen(false)} aria-hidden="true" />

          <div className="relative z-10 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl w-full max-w-2xl mx-auto">
            {/* Header Title & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-base font-bold text-slate-100">Navigation & Menu</h3>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Day Counter & Date Picker */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Day {currentDayNumber} <span className="text-slate-500">/ 90</span>
                </span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300">
                <CalendarIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-slate-400">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-100 outline-none cursor-pointer font-bold"
                />
              </div>
            </div>

            {/* Section 2: All Navigation Views Grid */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Navigation Modules
              </p>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.id)}
                      className={clsx(
                        'flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left font-semibold text-xs sm:text-sm transition-all cursor-pointer min-h-[48px]',
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 font-bold'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Quick System Actions & Account */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                System Controls
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px]"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <SyncStatusIndicator />
                </div>
              </div>

              {user && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <a
                      href={`mailto:${user.email}`}
                      title={`Send email to ${user.email}`}
                      className="truncate font-medium text-slate-300 hover:text-indigo-300 transition-colors"
                    >
                      {user.email}
                    </a>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

