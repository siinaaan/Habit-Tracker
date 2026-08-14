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
    { id: 'analytics' as NavigationTab, label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'goals' as NavigationTab, label: 'Goals', icon: <Target className="w-5 h-5" /> },
  ];

  const secondaryItems = [
    { id: 'calendar' as NavigationTab, label: '90-Day Calendar', icon: <CalendarDays className="w-5 h-5 text-indigo-400" /> },
    { id: 'weekly' as NavigationTab, label: 'Weekly Report', icon: <TrendingUp className="w-5 h-5 text-emerald-400" /> },
    { id: 'reflections' as NavigationTab, label: 'Reflections', icon: <BookOpen className="w-5 h-5 text-amber-400" /> },
    { id: 'learning' as NavigationTab, label: 'Learning Topics', icon: <GraduationCap className="w-5 h-5 text-purple-400" /> },
    { id: 'milestones' as NavigationTab, label: 'Milestones', icon: <Trophy className="w-5 h-5 text-yellow-400" /> },
    { id: 'pomodoro' as NavigationTab, label: 'Pomodoro Timer', icon: <Timer className="w-5 h-5 text-orange-400" /> },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: <Settings className="w-5 h-5 text-slate-400" /> },
  ];

  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* Mobile More Popover Drawer */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">All Sections</h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {secondaryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-2xl border text-left font-semibold text-xs transition-all',
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2">
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={clsx(
                  'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer',
                  isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={clsx(
              'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer',
              showMoreMenu ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
