import { useEffect } from 'react';
import type { NavigationTab } from '../types';

const TAB_TITLES: Record<NavigationTab, string> = {
  dashboard: 'Habit Tracker — Dashboard',
  daily: 'Habit Tracker — Daily Tracker',
  goals: 'Habit Tracker — Goals',
  expenses: 'Habit Tracker — Expenses',
  notes: 'Habit Tracker — Notes',
  analytics: 'Habit Tracker — Analytics',
  calendar: 'Habit Tracker — 90-Day Calendar',
  weekly: 'Habit Tracker — Weekly Report',
  reflections: 'Habit Tracker — Reflections',
  learning: 'Habit Tracker — Learning',
  milestones: 'Habit Tracker — Milestones',
  pomodoro: 'Habit Tracker — Pomodoro',
  settings: 'Habit Tracker — Settings',
};

export const useDocumentTitle = (activeTab?: NavigationTab | string, customTitle?: string) => {
  useEffect(() => {
    if (customTitle) {
      document.title = customTitle;
      return;
    }

    if (activeTab && activeTab in TAB_TITLES) {
      document.title = TAB_TITLES[activeTab as NavigationTab];
    } else if (activeTab) {
      document.title = 'Habit Tracker — Page Not Found';
    } else {
      document.title = 'Habit Tracker — Build Better Habits';
    }
  }, [activeTab, customTitle]);
};
