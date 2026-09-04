import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  Target,
  MoreHorizontal,
  CalendarDays,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Trophy,
  Timer,
  Wallet,
  StickyNote,
  Settings,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'daily' as NavigationTab, label: 'Daily', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'goals' as NavigationTab, label: 'Goals', icon: <Target className="w-5 h-5" /> },
  ];

  const secondaryItems = [
    { id: 'notes' as NavigationTab, label: 'Notes', icon: <StickyNote className="w-5 h-5 text-indigo-400" /> },
    { id: 'expenses' as NavigationTab, label: 'Expenses', icon: <Wallet className="w-5 h-5 text-emerald-400" /> },
    { id: 'analytics' as NavigationTab, label: 'Analytics', icon: <BarChart3 className="w-5 h-5 text-indigo-400" /> },
    { id: 'pomodoro' as NavigationTab, label: 'Pomodoro Timer', icon: <Timer className="w-5 h-5 text-orange-400" /> },
    { id: 'calendar' as NavigationTab, label: '90-Day Calendar', icon: <CalendarDays className="w-5 h-5 text-sky-400" /> },
    { id: 'weekly' as NavigationTab, label: 'Weekly Report', icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
    { id: 'reflections' as NavigationTab, label: 'Reflections', icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
    { id: 'learning' as NavigationTab, label: 'Learning Topics', icon: <GraduationCap className="w-5 h-5 text-purple-400" /> },
    { id: 'milestones' as NavigationTab, label: 'Milestones', icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  // Determine if active tab is one of secondary items
  const isSecondaryActive = secondaryItems.some((item) => item.id === activeTab);

  return (
    <>
      {/* Mobile More Popover Drawer */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          {/* Backdrop click to dismiss */}
          <div className="absolute inset-0" onClick={() => setShowMoreMenu(false)} aria-hidden="true" />

          <div className="relative z-10 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-base font-bold text-slate-100">All Modules & Views</h3>
              </div>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {secondaryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={clsx(
                    'flex items-center gap-3 p-3.5 rounded-2xl border text-left font-semibold text-xs transition-all cursor-pointer min-h-[52px]',
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-3 pt-1.5"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {primaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                aria-label={item.label}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer min-w-[64px] min-h-[44px]',
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            aria-label="More navigation options"
            aria-expanded={showMoreMenu}
            className={clsx(
              'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer min-w-[64px] min-h-[44px]',
              showMoreMenu || isSecondaryActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
