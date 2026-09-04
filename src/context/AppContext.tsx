import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Challenge,
  Habit,
  DailyTracker,
  HabitLog,
  Goal,
  Reflection,
  LearningItem,
  TaskItem,
  AppSettings,
  NavigationTab,
  ExpenseTransaction,
  Note,
  Debt,
} from '../types';
import { StorageService, isValidNavigationTab } from '../services/storage';
import { habitService } from '../services/habitService';
import { debtService } from '../services/debtService';
import { AnalyticsService } from '../services/analytics';
import { getTodayLocalDateStr, isDateLocked } from '../utils/dateUtils';
import { resolveHabitId, isMatchingDefaultHabit } from '../utils/habitUtils';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';

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
  todayDate: string;
  isSelectedDateLocked: boolean;

  // Primary Entities
  activeChallenge: Challenge | null;
  habits: Habit[];
  trackers: DailyTracker[];
  logs: HabitLog[];
  goals: Goal[];
  reflections: Reflection[];
  learningItems: LearningItem[];
  tasks: TaskItem[];
  expenses: ExpenseTransaction[];
  notes: Note[];
  debts: Debt[];
  settings: AppSettings;

  // Add Task & Add Habit Modal State
  isAddTaskModalOpen: boolean;
  setIsAddTaskModalOpen: (open: boolean) => void;
  isAddHabitModalOpen: boolean;
  setIsAddHabitModalOpen: (open: boolean) => void;
  editingHabit: Habit | null;
  setEditingHabit: (habit: Habit | null) => void;
  openAddHabitModal: (habit?: Habit | null) => void;

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

  saveTask: (task: TaskItem) => void;
  deleteTask: (id: string) => void;
  toggleTaskCompleted: (id: string) => void;

  saveExpense: (expense: ExpenseTransaction) => void;
  deleteExpense: (id: string) => void;

  saveDebt: (debt: Debt) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addDebtRepayment: (debtId: string, repaymentData: { amount: number; date: string; note?: string }) => Promise<void>;
  deleteDebtRepayment: (debtId: string, repaymentId: string) => Promise<void>;

  saveNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;

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
  const { user } = useAuth();
  const userId = user?.id || null;

  // Navigation & Date State
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => StorageService.getActiveTab(userId));
  const [todayDate, setTodayDate] = useState<string>(getTodayLocalDateStr());
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDateStr());

  const isSelectedDateLocked = isDateLocked(selectedDate);

  const setActiveTab = (tab: NavigationTab) => {
    if (isValidNavigationTab(tab)) {
      setActiveTabState(tab);
      StorageService.setActiveTab(tab, userId);
    }
  };

  useEffect(() => {
    if (userId) {
      const savedTab = StorageService.getActiveTab(userId);
      setActiveTabState(savedTab);
    }
  }, [userId]);

  // Entities
  const [activeChallenge, setActiveChallengeState] = useState<Challenge | null>(
    () => StorageService.getActiveChallenge(userId) || StorageService.getActiveChallenge()
  );
  const [habits, setHabitsState] = useState<Habit[]>(() => StorageService.getHabits(userId));
  const [trackers, setTrackersState] = useState<DailyTracker[]>(() => StorageService.getTrackers(userId));
  const [logs, setLogsState] = useState<HabitLog[]>(() => StorageService.getLogs(userId));
  const [goals, setGoalsState] = useState<Goal[]>([]);
  const [reflections, setReflectionsState] = useState<Reflection[]>([]);
  const [learningItems, setLearningItemsState] = useState<LearningItem[]>([]);
  const [tasks, setTasksState] = useState<TaskItem[]>([]);
  const [expenses, setExpensesState] = useState<ExpenseTransaction[]>([]);
  const [notes, setNotesState] = useState<Note[]>([]);
  const [debts, setDebtsState] = useState<Debt[]>(() => StorageService.getDebts(userId));
  const [settings, setSettingsState] = useState<AppSettings>(StorageService.getSettings());

  // Add Task & Add Habit Modal State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState<boolean>(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const openAddHabitModal = (habit?: Habit | null) => {
    setEditingHabit(habit || null);
    setIsAddHabitModalOpen(true);
  };

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

  // Load state from habitService (which syncs Supabase + Local Cache)
  const refreshAllState = async () => {
    StorageService.initializeStorage();

    const userId = await habitService.getAuthenticatedUserId();
    const fetchedChallenge = await habitService.getChallengeProgress();
    const fetchedHabits = await habitService.getHabits();
    const fetchedLogs = await habitService.getHabitCompletions();
    const fetchedTasks = await habitService.getTasks();
    const fetchedExpenses = await habitService.getExpenses();
    const fetchedNotes = await habitService.getNotes();
    const fetchedDebts = await debtService.getDebts();

    setActiveChallengeState(fetchedChallenge || StorageService.getActiveChallenge(userId));
    setHabitsState(fetchedHabits);
    setLogsState(fetchedLogs);
    setTasksState(fetchedTasks);
    setExpensesState(fetchedExpenses);
    setNotesState(fetchedNotes);
    setDebtsState(fetchedDebts);
    
    setTrackersState(StorageService.getTrackers(userId));
    setGoalsState(StorageService.getGoals());
    setReflectionsState(StorageService.getReflections());
    setLearningItemsState(StorageService.getLearningItems());
    setSettingsState(StorageService.getSettings());
  };

  useEffect(() => {
    refreshAllState();

    if (userId) {
      debtService.initRealtimeSubscriptions(userId);
    }
    habitService.setRemoteChangeCallback(() => {
      refreshAllState();
    });
    debtService.setRemoteChangeCallback(() => {
      refreshAllState();
    });

    const checkDateRollover = () => {
      const currentToday = getTodayLocalDateStr();
      setTodayDate((prevToday) => {
        if (currentToday !== prevToday) {
          setSelectedDate((prevSelected) => {
            if (prevSelected === prevToday || prevSelected < currentToday) {
              return currentToday;
            }
            return prevSelected;
          });
          return currentToday;
        }
        return prevToday;
      });
    };

    const intervalId = setInterval(checkDateRollover, 10000);

    const handleFocus = () => {
      checkDateRollover();
      if (navigator.onLine) {
        refreshAllState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkDateRollover();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      habitService.setRemoteChangeCallback(null);
      debtService.unsubscribeRealtime();
      debtService.setRemoteChangeCallback(null);
    };
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
  const deterministicTrackerId = `tracker-${selectedDate}`;
  const selectedDayLogs = logs.filter(
    (l) =>
      l.dailyTrackerId === deterministicTrackerId ||
      l.dailyTrackerId === selectedDate ||
      l.dailyTrackerId.includes(selectedDate)
  );

  const activeHabitsList = habits.filter((h) => h.active);
  const completedLogsForSelectedDay = selectedDayLogs.filter((l) => l.completed).length;
  const computedCompletionPercentage = activeHabitsList.length
    ? Math.round((completedLogsForSelectedDay / activeHabitsList.length) * 100)
    : 0;

  const baseTracker = trackers.find((t) => t.date === selectedDate || t.id === deterministicTrackerId);
  const selectedDayTracker: DailyTracker = {
    id: baseTracker?.id || deterministicTrackerId,
    challengeId: baseTracker?.challengeId || activeChallenge?.id || '',
    dayNumber: baseTracker?.dayNumber || currentDayNumber,
    date: selectedDate,
    completionPercentage: computedCompletionPercentage,
    notes: baseTracker?.notes || '',
    createdDate: baseTracker?.createdDate || new Date().toISOString(),
    updatedDate: baseTracker?.updatedDate || new Date().toISOString(),
  };

  // --- CRUD Implementations ---
  const saveChallenge = (challenge: Challenge) => {
    StorageService.saveChallenge(challenge);
    habitService.updateChallengeProgress(challenge.id, challenge);
    setActiveChallengeState(challenge);
    showToast('Challenge updated successfully!', 'success');
  };

  const deleteChallenge = (id: string) => {
    StorageService.deleteChallenge(id);
    refreshAllState();
    showToast('Challenge deleted.', 'info');
  };

  const saveHabit = async (habit: Habit) => {
    StorageService.saveHabit(habit);
    const existing = habits.find((h) => h.id === habit.id);
    let res: { synced: boolean; error?: string };
    if (existing) {
      res = await habitService.updateHabit(habit.id, habit);
    } else {
      res = await habitService.createHabit(habit);
    }
    const updatedList = await habitService.getHabits();
    setHabitsState(updatedList);

    if (res.synced) {
      showToast(`Habit "${habit.name}" saved & synced!`, 'success');
    } else if (res.error) {
      console.warn('Habit cloud sync warning:', res.error);
      showToast(`Habit "${habit.name}" saved locally. Sync will retry when online.`, 'info');
    } else {
      showToast(`Habit "${habit.name}" saved locally (offline)`, 'info');
    }
  };

  const saveHabitsOrder = (newHabits: Habit[]) => {
    StorageService.saveHabits(newHabits);
    newHabits.forEach((h) => habitService.updateHabit(h.id, { order: h.order }));
    setHabitsState(newHabits);
  };

  const deleteHabit = async (id: string) => {
    StorageService.deleteHabit(id);
    setHabitsState((prev) => prev.filter((h) => h.id !== id));
    const res = await habitService.deleteHabit(id);
    const updatedList = await habitService.getHabits();
    setHabitsState(updatedList);

    if (res.success && res.synced) {
      showToast('Habit deleted & synced.', 'info');
    } else if (res.success) {
      showToast('Habit deleted locally.', 'info');
    } else if (res.error) {
      console.warn('Habit delete error:', res.error);
      showToast('Unable to delete habit from cloud. Please try again.', 'error');
    }
  };

  // Instant Habit Logging for current selected date
  const updateHabitLog = async (habitId: string, logData: Partial<HabitLog>) => {
    const userId = await habitService.getAuthenticatedUserId();
    const challenge = activeChallenge || StorageService.getActiveChallenge(userId);

    const todayStr = getTodayLocalDateStr();
    const isLocked = isDateLocked(selectedDate);

    // Action-level enforcement: Reject modifications for any non-today date (previous or future)
    if (isLocked) {
      const isFuture = selectedDate > todayStr;
      showToast(
        isFuture
          ? '🔒 Future dates are locked. Check-ins can only be recorded for today.'
          : '🔒 Previous day records are locked and read-only.',
        'warning'
      );
      return;
    }

    const trackerId = `tracker-${selectedDate}`;
    let tracker = trackers.find((t) => t.date === selectedDate || t.id === trackerId);
    const dayNum = challenge
      ? AnalyticsService.calculateDayNumber(challenge.startDate, selectedDate)
      : 1;

    // If tracker doesn't exist yet for selected date, create it
    if (!tracker) {
      tracker = {
        id: trackerId,
        challengeId: challenge?.id || 'general',
        dayNumber: dayNum,
        date: selectedDate,
        completionPercentage: 0,
        notes: '',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };
      StorageService.saveTracker(tracker, userId);
      setTrackersState(StorageService.getTrackers(userId));
    }

    const effectiveHabitId = resolveHabitId(habitId, habits, userId);

    // Synchronous local lookup to prevent race conditions on rapid clicks
    const localLogs = StorageService.getLogs(userId);
    let existingLog = localLogs.find(
      (l) =>
        (l.dailyTrackerId === tracker!.id ||
          l.dailyTrackerId === selectedDate ||
          l.dailyTrackerId.includes(selectedDate)) &&
        (l.habitId === effectiveHabitId || isMatchingDefaultHabit(l.habitId, habitId, userId))
    );

    const isNew = !existingLog;
    let updatedLog: HabitLog;

    if (!existingLog) {
      const newLog: HabitLog = {
        id: `log-${tracker.id}-${effectiveHabitId}`,
        habitId: effectiveHabitId,
        dailyTrackerId: tracker.id,
        completed: false,
        numericValue: null,
        duration: null,
        timeValue: null,
        notes: '',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };
      updatedLog = { ...newLog, ...logData, updatedDate: new Date().toISOString() };
    } else {
      updatedLog = { ...existingLog, ...logData, updatedDate: new Date().toISOString() };
    }

    // 1. Immediately persist to localStorage & update React state optimistically
    StorageService.saveLog(updatedLog, userId);
    setLogsState((prev) => {
      const idx = prev.findIndex((l) => l.id === updatedLog.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedLog;
        return copy;
      }
      return [...prev, updatedLog];
    });

    // 2. Re-evaluate tracker completion percentage
    const allLogsForTracker = StorageService.getLogs(userId).filter(
      (l) =>
        l.dailyTrackerId === tracker!.id ||
        l.dailyTrackerId === selectedDate ||
        l.dailyTrackerId.includes(selectedDate)
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

    StorageService.saveTracker(updatedTracker, userId);
    setTrackersState(StorageService.getTrackers(userId));

    if (newCompletion === 100 && tracker.completionPercentage < 100) {
      triggerConfetti();
      showToast(challenge ? `🔥 Boom! Day ${dayNum} 100% Completed!` : `🔥 Boom! Today's Habits 100% Completed!`, 'success');
    }

    // 3. Sync to Supabase in background with error handling & state rollback
    const res = isNew
      ? await habitService.createCompletion(updatedLog)
      : await habitService.updateCompletion(updatedLog.id, updatedLog);

    if (res.error) {
      console.warn('Habit completion sync warning:', res.error);
      showToast("Unable to save check-in. Please try again.", 'error');
      // Rollback optimistic state if sync failed
      if (existingLog) {
        StorageService.saveLog(existingLog, userId);
        setLogsState((prev) => prev.map((l) => (l.id === existingLog!.id ? existingLog! : l)));
      } else {
        StorageService.deleteLog(updatedLog.id, userId);
        setLogsState((prev) => prev.filter((l) => l.id !== updatedLog.id));
      }
    }
  };

  const deleteDailyTracker = (id: string) => {
    const tracker = trackers.find((t) => t.id === id);
    if (tracker && tracker.date < getTodayLocalDateStr()) {
      showToast('🔒 Previous day records are locked and read-only.', 'warning');
      return;
    }
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

  // Tasks CRUD
  const saveTask = async (task: TaskItem) => {
    StorageService.saveTask(task);
    const existing = tasks.find((t) => t.id === task.id);
    let res: { synced: boolean; error?: string };
    if (existing) {
      res = await habitService.updateTask(task.id, task);
    } else {
      res = await habitService.createTask(task);
    }
    const updatedTasks = await habitService.getTasks();
    setTasksState(updatedTasks);

    if (res.synced) {
      showToast(`Task "${task.title}" saved & synced!`, 'success');
    } else if (res.error) {
      console.warn('Task cloud sync warning:', res.error);
      showToast(`Task "${task.title}" saved locally. Sync will retry when online.`, 'info');
    } else {
      showToast(`Task "${task.title}" saved locally (offline)`, 'info');
    }
  };

  const deleteTask = async (id: string) => {
    StorageService.deleteTask(id);
    await habitService.deleteTask(id);
    const updatedTasks = await habitService.getTasks();
    setTasksState(updatedTasks);
    showToast('Task deleted.', 'info');
  };

  const toggleTaskCompleted = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = !task.completed;
    const updated = { ...task, completed: newStatus, updatedDate: new Date().toISOString() };
    StorageService.saveTask(updated);
    const res = await habitService.updateTask(id, { completed: newStatus });
    const updatedTasks = await habitService.getTasks();
    setTasksState(updatedTasks);
    if (newStatus) {
      triggerConfetti();
      if (res.synced) {
        showToast(`Task "${task.title}" completed & synced!`, 'success');
      } else if (res.error) {
        console.warn('Task completion sync warning:', res.error);
        showToast(`Task completed locally. Sync will retry when online.`, 'info');
      } else {
        showToast(`Task "${task.title}" completed locally!`, 'info');
      }
    }
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

  // Expenses CRUD
  const saveExpense = async (expense: ExpenseTransaction) => {
    StorageService.saveExpense(expense);
    const existing = expenses.find((e) => e.id === expense.id);
    let res: { synced: boolean; error?: string };
    if (existing) {
      res = await habitService.updateExpense(expense.id, expense);
    } else {
      res = await habitService.createExpense(expense);
    }
    const updatedExpenses = await habitService.getExpenses();
    setExpensesState(updatedExpenses);

    if (res.synced) {
      showToast(`Expense "${expense.title}" saved & synced!`, 'success');
    } else if (res.error) {
      console.warn('Expense sync warning:', res.error);
      showToast(`Expense "${expense.title}" saved locally. Sync will retry when online.`, 'info');
    } else {
      showToast(`Expense "${expense.title}" saved locally (offline)`, 'info');
    }
  };

  const deleteExpense = async (id: string) => {
    StorageService.deleteExpense(id);
    await habitService.deleteExpense(id);
    const updatedExpenses = await habitService.getExpenses();
    setExpensesState(updatedExpenses);
    showToast('Expense transaction deleted.', 'info');
  };

  // Debts CRUD
  const saveDebt = async (debt: Debt) => {
    StorageService.saveDebt(debt, userId);
    const existing = debts.find((d) => d.id === debt.id);
    let res: { synced: boolean; error?: string };
    if (existing) {
      res = await debtService.updateDebt(debt.id, debt, userId);
    } else {
      res = await debtService.createDebt(debt, userId);
    }
    const updated = await debtService.getDebts(userId);
    setDebtsState(updated);

    if (res.synced) {
      showToast(`Debt for "${debt.personName}" saved & synced!`, 'success');
    } else if (!navigator.onLine) {
      showToast(`Debt for "${debt.personName}" saved locally (offline)`, 'info');
    } else {
      showToast(`Could not save debt for "${debt.personName}". Please try again.`, 'error');
    }
  };

  const deleteDebt = async (id: string) => {
    StorageService.deleteDebt(id, userId);
    await debtService.deleteDebt(id, userId);
    const updated = await debtService.getDebts(userId);
    setDebtsState(updated);
    showToast('Debt record deleted.', 'info');
  };

  const addDebtRepayment = async (debtId: string, repaymentData: { amount: number; date: string; note?: string }) => {
    const res = await debtService.addRepayment(debtId, repaymentData, userId);

    // Immediately update local React state with the returned updated debt
    if (res.debt) {
      setDebtsState((prevDebts) =>
        prevDebts.map((d) => (d.id === debtId ? res.debt! : d))
      );
    }

    if (res.synced) {
      const updated = await debtService.getDebts(userId);
      setDebtsState(updated);
      showToast('Repayment added successfully', 'success');
    } else if (!navigator.onLine) {
      showToast("You're offline. Repayment saved locally and will sync when you're online.", 'info');
    } else {
      showToast('Could not save repayment. Please try again.', 'error');
    }
  };

  const deleteDebtRepayment = async (debtId: string, repaymentId: string) => {
    const res = await debtService.deleteRepayment(debtId, repaymentId, userId);
    const updated = await debtService.getDebts(userId);
    setDebtsState(updated);
    if (res.synced) {
      showToast('Repayment record deleted.', 'info');
    } else if (!navigator.onLine) {
      showToast('Repayment deleted locally (offline).', 'info');
    } else {
      showToast('Could not delete repayment from server. Scheduled for sync.', 'warning');
    }
  };

  // Notes CRUD
  const saveNote = async (note: Note) => {
    StorageService.saveNote(note);
    const existing = notes.find((n) => n.id === note.id);
    let res: { synced: boolean; error?: string };
    if (existing) {
      res = await habitService.updateNote(note.id, note);
    } else {
      res = await habitService.createNote(note);
    }
    const updatedNotes = await habitService.getNotes();
    setNotesState(updatedNotes);

    if (res.synced) {
      showToast(`Note "${note.title}" saved & synced!`, 'success');
    } else if (res.error) {
      console.warn('Note sync warning:', res.error);
      showToast(`Note "${note.title}" saved locally. Sync will retry when online.`, 'info');
    } else {
      showToast(`Note "${note.title}" saved locally (offline)`, 'info');
    }
  };

  const deleteNote = async (id: string) => {
    StorageService.deleteNote(id);
    await habitService.deleteNote(id);
    const updatedNotes = await habitService.getNotes();
    setNotesState(updatedNotes);
    showToast('Note deleted.', 'info');
  };

  const toggleArchiveNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newArchived = !note.archived;
    const updated = { ...note, archived: newArchived, updatedDate: new Date().toISOString() };
    StorageService.saveNote(updated);
    await habitService.updateNote(id, { archived: newArchived });
    const updatedNotes = await habitService.getNotes();
    setNotesState(updatedNotes);
    showToast(newArchived ? `Note "${note.title}" archived.` : `Note "${note.title}" restored.`, 'info');
  };

  // Settings
  const updateSettings = (newSettings: AppSettings) => {
    StorageService.saveSettings(newSettings);
    setSettingsState(newSettings);
    showToast('Settings saved!', 'success');
  };

  // Actions
  const resetToNewChallenge = (name?: string, startDate?: string) => {
    const newCh = StorageService.resetToNewChallenge(name, startDate);
    habitService.createChallengeProgress(newCh);
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
    StorageService.clearAllData(userId);
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
        todayDate,
        isSelectedDateLocked,
        activeChallenge,
        habits,
        trackers,
        logs,
        goals,
        reflections,
        learningItems,
        tasks,
        expenses,
        notes,
        debts,
        settings,
        isAddTaskModalOpen,
        setIsAddTaskModalOpen,
        isAddHabitModalOpen,
        setIsAddHabitModalOpen,
        editingHabit,
        setEditingHabit,
        openAddHabitModal,
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
        saveTask,
        deleteTask,
        toggleTaskCompleted,
        saveExpense,
        deleteExpense,
        saveDebt,
        deleteDebt,
        addDebtRepayment,
        deleteDebtRepayment,
        saveNote,
        deleteNote,
        toggleArchiveNote,
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
