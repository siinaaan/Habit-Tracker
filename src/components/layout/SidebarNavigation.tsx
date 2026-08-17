import React from 'react';
import { useApp } from '../../context/AppContext';
import type { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  CalendarCheck,
  BarChart3,
  CalendarDays,
  TrendingUp,
  Target,
  BookOpen,
  GraduationCap,
  Trophy,
  Timer,
  Wallet,
  Settings as SettingsIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ReactNode;
}

export const SidebarNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'daily', label: 'Daily Tracker', icon: <CalendarCheck className="w-5 h-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <Wallet className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'calendar', label: '90-Day Calendar', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'weekly', label: 'Weekly Report', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
    { id: 'reflections', label: 'Reflections', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'learning', label: 'Learning', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'milestones', label: 'Milestones', icon: <Trophy className="w-5 h-5" /> },
    { id: 'pomodoro', label: 'Pomodoro Timer', icon: <Timer className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-950 border-r border-slate-800/80 p-4 space-y-6 h-full overflow-y-auto">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              )}
            >
              <span className={clsx(isActive ? 'text-white' : 'text-slate-400')}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
