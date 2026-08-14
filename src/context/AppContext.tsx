import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Challenge,
  Habit,
  DailyTracker,
  HabitLog,
  Goal,
  Reflection,
  LearningItem,
  AppSettings,
  NavigationTab,
} from '../types';
import { StorageService } from '../services/storage';
import { AnalyticsService } from '../services/analytics';
import confetti from 'canvas-confetti';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  // Navigation State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Primary Entities
  activeChallenge: Challenge | null;
  habits: Habit[];
  trackers: DailyTracker[];
  logs: HabitLog[];
  goals: Goal[];
  reflections: Reflection[];
  learningItems: LearningItem[];
  settings: AppSettings;

  // Active Day Number
  currentDayNumber: number;
  selectedDayTracker: DailyTracker | null;
  selectedDayLogs: HabitLog[];

  // CRUD Operations
  saveChallenge: (challenge: Challenge) => void;
  deleteChallenge: (id: string) => void;
  
  saveHabit: (habit: Habit) => void;
  saveHabitsOrder: (habits: Habit[]) => void;
  deleteHabit: (id: string) => void;

  updateHabitLog: (habitId: string, logData: Partial<HabitLog>) => void;
  deleteDailyTracker: (id: string) => void;

  saveGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;

  saveReflection: (reflection: Reflection) => void;
  deleteReflection: (id: string) => void;

  saveLearningItem: (item: LearningItem) => void;
  deleteLearningItem: (id: string) => void;

  updateSettings: (settings: AppSettings) => void;

  // Actions
  triggerConfetti: () => void;
  resetToNewChallenge: (name?: string, startDate?: string) => void;
  importBackupData: (jsonStr: string) => void;
  clearAllData: () => void;

  // Toast
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Entities
  const [activeChallenge, setActiveChallengeState] = useState<Challenge | null>(null);
  const [habits, setHabitsState] = useState<Habit[]>([]);
  const [trackers, setTrackersState] = useState<DailyTracker[]>([]);
  const [logs, setLogsState] = useState<HabitLog[]>([]);
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [reflections, setReflectionsState] = useState<Reflection[]>([]);
  const [learningItems, setLearningItemsState] = useState<LearningItem[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>(StorageService.getSettings());

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Load state from local storage on mount
  const refreshAllState = () => {
    StorageService.initializeStorage();
    setActiveChallengeState(StorageService.getActiveChallenge());
    setHabitsState(StorageService.getHabits());
    setTrackersState(StorageService.getTrackers());
    setLogsState(StorageService.getLogs());
    setGoalsState(StorageService.getGoals());
    setReflectionsState(StorageService.getReflections());
    setLearningItemsState(StorageService.getLearningItems());
    setSettingsState(StorageService.getSettings());
  };

  useEffect(() => {
    refreshAllState();
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Current day calculation
  const currentDayNumber = activeChallenge
    ? AnalyticsService.calculateDayNumber(activeChallenge.startDate, selectedDate)
    : 1;

  // Selected date tracker & logs
  let selectedDayTracker = trackers.find((t) => t.date === selectedDate) || null;
  
  // If no tracker exists for selectedDate, dynamically generate draft or ensure one
  const selectedDayLogs = selectedDayTracker
    ? logs.filter((l) => l.dailyTrackerId === selectedDayTracker!.id)
    : [];

  // --- CRUD Implementations ---
  const saveChallenge = (challenge: Challenge) => {
    StorageService.saveChallenge(challenge);
    setActiveChallengeState(challenge);
    showToast('Challenge updated successfully!', 'success');
  };

  const deleteChallenge = (id: string) => {
    StorageService.deleteChallenge(id);
    refreshAllState();
    showToast('Challenge deleted.', 'info');
  };

  const saveHabit = (habit: Habit) => {
    StorageService.saveHabit(habit);
    setHabitsState(StorageService.getHabits());
    showToast(`Habit "${habit.name}" saved!`, 'success');
  };

  const saveHabitsOrder = (newHabits: Habit[]) => {
    StorageService.saveHabits(newHabits);
    setHabitsState(newHabits);
  };

  const deleteHabit = (id: string) => {
    StorageService.deleteHabit(id);
    setHabitsState(StorageService.getHabits());
    showToast('Habit deleted.', 'info');
  };

  // Instant Habit Logging for current selected date
  const updateHabitLog = (habitId: string, logData: Partial<HabitLog>) => {
    if (!activeChallenge) return;

    let tracker = trackers.find((t) => t.date === selectedDate);
    const dayNum = AnalyticsService.calculateDayNumber(
      activeChallenge.startDate,
      selectedDate
    );

    // If tracker doesn't exist yet for selected date, create it
    if (!tracker) {
      tracker = {
        id: `tracker-${selectedDate}`,
        challengeId: activeChallenge.id,
        dayNumber: dayNum,
        date: selectedDate,
        completionPercentage: 0,
        notes: '',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };
      StorageService.saveTracker(tracker);
    }

    const currentLogs = StorageService.getLogs();
    let existingLog = currentLogs.find(
      (l) => l.dailyTrackerId === tracker!.id && l.habitId === habitId
    );

    if (!existingLog) {
      existingLog = {
        id: `log-${tracker.id}-${habitId}`,
        habitId,
        dailyTrackerId: tracker.id,
        completed: false,
        numericValue: null,
        duration: null,
        timeValue: null,
        notes: '',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };
    }

    const updatedLog: HabitLog = {
      ...existingLog,
      ...logData,
      updatedDate: new Date().toISOString(),
    };

    StorageService.saveLog(updatedLog);

    // Re-evaluate tracker completion percentage
    const allLogsForTracker = StorageService.getLogs().filter(
      (l) => l.dailyTrackerId === tracker!.id
    );

    const activeHabits = habits.filter((h) => h.active);
    const newCompletion = AnalyticsService.calculateDailyCompletionPercentage(
      allLogsForTracker,
      activeHabits
    );

    const updatedTracker: DailyTracker = {
      ...tracker,
      completionPercentage: newCompletion,
      updatedDate: new Date().toISOString(),
    };

    StorageService.saveTracker(updatedTracker);

    // Refresh memory states
    setTrackersState(StorageService.getTrackers());
    setLogsState(StorageService.getLogs());

    if (newCompletion === 100 && tracker.completionPercentage < 100) {
      triggerConfetti();
      showToast(`🔥 Boom! Day ${dayNum} 100% Completed!`, 'success');
    }
  };

  const deleteDailyTracker = (id: string) => {
    StorageService.deleteTracker(id);
    setTrackersState(StorageService.getTrackers());
    setLogsState(StorageService.getLogs());
    showToast('Daily record deleted.', 'info');
  };

  // Goals CRUD
  const saveGoal = (goal: Goal) => {
    StorageService.saveGoal(goal);
    setGoalsState(StorageService.getGoals());
    showToast(`Goal "${goal.title}" saved!`, 'success');
  };

  const deleteGoal = (id: string) => {
    StorageService.deleteGoal(id);
    setGoalsState(StorageService.getGoals());
    showToast('Goal deleted.', 'info');
  };

  // Reflection CRUD
  const saveReflection = (reflection: Reflection) => {
    StorageService.saveReflection(reflection);
    setReflectionsState(StorageService.getReflections());
    showToast('Reflection saved!', 'success');
  };

  const deleteReflection = (id: string) => {
    StorageService.deleteReflection(id);
    setReflectionsState(StorageService.getReflections());
    showToast('Reflection deleted.', 'info');
  };

  // Learning Items CRUD
  const saveLearningItem = (item: LearningItem) => {
    StorageService.saveLearningItem(item);
    setLearningItemsState(StorageService.getLearningItems());
    showToast(`Learning item "${item.topic}" saved!`, 'success');
  };

  const deleteLearningItem = (id: string) => {
    StorageService.deleteLearningItem(id);
    setLearningItemsState(StorageService.getLearningItems());
    showToast('Learning item deleted.', 'info');
  };

  // Settings
  const updateSettings = (newSettings: AppSettings) => {
    StorageService.saveSettings(newSettings);
    setSettingsState(newSettings);
    showToast('Settings saved!', 'success');
  };

  // Actions
  const resetToNewChallenge = (name?: string, startDate?: string) => {
    StorageService.resetToNewChallenge(name, startDate);
    refreshAllState();
    triggerConfetti();
    showToast('🔥 New 90-Day Challenge Started! Day 1 is Live.', 'success');
  };

  const importBackupData = (jsonStr: string) => {
    const result = StorageService.importFullBackupJSON(jsonStr);
    if (result.success) {
      refreshAllState();
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const clearAllData = () => {
    StorageService.clearAllData();
    refreshAllState();
    showToast('All application data cleared.', 'warning');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        activeChallenge,
        habits,
        trackers,
        logs,
        goals,
        reflections,
        learningItems,
        settings,
        currentDayNumber,
        selectedDayTracker,
        selectedDayLogs,
        saveChallenge,
        deleteChallenge,
        saveHabit,
        saveHabitsOrder,
        deleteHabit,
        updateHabitLog,
        deleteDailyTracker,
        saveGoal,
        deleteGoal,
        saveReflection,
        deleteReflection,
        saveLearningItem,
        deleteLearningItem,
        updateSettings,
        triggerConfetti,
        resetToNewChallenge,
        importBackupData,
        clearAllData,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
