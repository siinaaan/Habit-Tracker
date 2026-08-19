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
  ExpenseTransaction,
  Note,
} from '../types';
import { DEFAULT_HABITS } from '../constants/defaultHabits';

const KEYS = {
  CHALLENGES: 'life_upgrade_challenge_cache',
  HABITS: 'life_upgrade_habits_cache',
  TRACKERS: 'life_upgrade_trackers',
  LOGS: 'life_upgrade_completions_cache',
  GOALS: 'life_upgrade_goals',
  REFLECTIONS: 'life_upgrade_reflections',
  LEARNING: 'life_upgrade_learning',
  TASKS: 'life_upgrade_tasks_cache',
  SETTINGS: 'life_upgrade_settings',
  EXPENSES: 'life_upgrade_expenses_cache',
  NOTES: 'life_upgrade_notes_cache',
};

function getCacheKey(baseKey: string, userId?: string | null): string {
  if (userId) return `${baseKey}_${userId}`;
  return baseKey;
}

// Safe JSON parser
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  waterGoal: 2.5,
  sleepGoalHours: 8,
  screenTimeLimitHours: 3.5,
  pomodoroSettings: {
    focusDuration: 50,
    shortBreakDuration: 10,
    longBreakDuration: 20,
    longBreakInterval: 4,
    workStartTime: '09:30',
    workEndTime: '16:30',
  },
  isDemoMode: false,
};

export class StorageService {
  // Initialize storage with clean zero-progress state if empty
  static initializeStorage(): void {
    const existingChallenges = localStorage.getItem(KEYS.CHALLENGES);
    if (!existingChallenges) {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const endDateObj = new Date();
      endDateObj.setDate(endDateObj.getDate() + 89);
      const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, '0')}-${String(endDateObj.getDate()).padStart(2, '0')}`;

      const freshChallenge: Challenge = {
        id: `challenge-${Date.now()}`,
        name: '90-Day High Performance Upgrade',
        startDate: todayStr,
        endDate: endDateStr,
        description: 'Transforming discipline, spiritual alignment, coding mastery, and physical health in 90 structured days.',
        status: 'Active',
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      };

      setItem(KEYS.CHALLENGES, [freshChallenge]);
      setItem(KEYS.HABITS, DEFAULT_HABITS);
      setItem(KEYS.TRACKERS, []);
      setItem(KEYS.LOGS, []);
      setItem(KEYS.GOALS, []);
      setItem(KEYS.REFLECTIONS, []);
      setItem(KEYS.LEARNING, []);
      setItem(KEYS.TASKS, []);
      setItem(KEYS.SETTINGS, DEFAULT_SETTINGS);

      // Clear habitService caches on fresh initialization
      localStorage.removeItem('life_upgrade_completions_cache');
      localStorage.removeItem('life_upgrade_challenge_cache');
      localStorage.removeItem('life_upgrade_tasks_cache');
    }
  }

  // --- Challenges ---
  static getChallenges(userId?: string | null): Challenge[] {
    return getItem<Challenge[]>(getCacheKey(KEYS.CHALLENGES, userId), []);
  }

  static getActiveChallenge(userId?: string | null): Challenge | null {
    const challenges = this.getChallenges(userId);
    return challenges.find((c) => c.status === 'Active') || challenges[0] || null;
  }

  static saveChallenge(challenge: Challenge, userId?: string | null): Challenge {
    const key = getCacheKey(KEYS.CHALLENGES, userId);
    const challenges = getItem<Challenge[]>(key, []);
    const idx = challenges.findIndex((c) => c.id === challenge.id);
    let updated: Challenge[];
    if (idx >= 0) {
      challenges[idx] = { ...challenge, updatedDate: new Date().toISOString() };
      updated = [...challenges];
    } else {
      updated = [...challenges, challenge];
    }
    setItem(key, updated);
    return challenge;
  }

  static deleteChallenge(id: string, userId?: string | null): void {
    const key = getCacheKey(KEYS.CHALLENGES, userId);
    const challenges = getItem<Challenge[]>(key, []).filter((c) => c.id !== id);
    setItem(key, challenges);
  }

  // --- Habits ---
  static getHabits(userId?: string | null): Habit[] {
    return getItem<Habit[]>(getCacheKey(KEYS.HABITS, userId), DEFAULT_HABITS);
  }

  static saveHabit(habit: Habit, userId?: string | null): Habit {
    const key = getCacheKey(KEYS.HABITS, userId);
    const habits = getItem<Habit[]>(key, DEFAULT_HABITS);
    const idx = habits.findIndex((h) => h.id === habit.id);
    let updated: Habit[];
    if (idx >= 0) {
      habits[idx] = { ...habit, updatedDate: new Date().toISOString() };
      updated = [...habits];
    } else {
      updated = [...habits, habit];
    }
    setItem(key, updated);
    return habit;
  }

  static saveHabits(habits: Habit[], userId?: string | null): void {
    setItem(getCacheKey(KEYS.HABITS, userId), habits);
  }

  static deleteHabit(id: string, userId?: string | null): void {
    const key = getCacheKey(KEYS.HABITS, userId);
    const habits = getItem<Habit[]>(key, DEFAULT_HABITS).filter((h) => h.id !== id);
    setItem(key, habits);
  }

  // --- Daily Trackers ---
  static getTrackers(userId?: string | null): DailyTracker[] {
    return getItem<DailyTracker[]>(getCacheKey(KEYS.TRACKERS, userId), []);
  }

  static saveTracker(tracker: DailyTracker, userId?: string | null): DailyTracker {
    const key = getCacheKey(KEYS.TRACKERS, userId);
    const trackers = getItem<DailyTracker[]>(key, []);
    const idx = trackers.findIndex((t) => t.id === tracker.id);
    let updated: DailyTracker[];
    if (idx >= 0) {
      trackers[idx] = { ...tracker, updatedDate: new Date().toISOString() };
      updated = [...trackers];
    } else {
      updated = [...trackers, tracker];
    }
    setItem(key, updated);
    return tracker;
  }

  static deleteTracker(id: string, userId?: string | null): void {
    const key = getCacheKey(KEYS.TRACKERS, userId);
    const trackers = getItem<DailyTracker[]>(key, []).filter((t) => t.id !== id);
    setItem(key, trackers);

    // Clean up habit logs associated with this tracker
    const logs = this.getLogs(userId).filter((l) => l.dailyTrackerId !== id);
    this.saveLogs(logs, userId);
  }

  // --- Habit Logs ---
  static getLogs(userId?: string | null): HabitLog[] {
    return getItem<HabitLog[]>(getCacheKey(KEYS.LOGS, userId), []);
  }

  static saveLog(log: HabitLog, userId?: string | null): HabitLog {
    const key = getCacheKey(KEYS.LOGS, userId);
    const logs = getItem<HabitLog[]>(key, []);
    const idx = logs.findIndex((l) => l.id === log.id);
    let updated: HabitLog[];
    if (idx >= 0) {
      logs[idx] = { ...log, updatedDate: new Date().toISOString() };
      updated = [...logs];
    } else {
      updated = [...logs, log];
    }
    setItem(key, updated);
    return log;
  }

  static saveLogs(newLogs: HabitLog[], userId?: string | null): void {
    const key = getCacheKey(KEYS.LOGS, userId);
    const existingLogs = getItem<HabitLog[]>(key, []);
    const logMap = new Map<string, HabitLog>(existingLogs.map((l) => [l.id, l]));
    newLogs.forEach((l) => logMap.set(l.id, { ...l, updatedDate: new Date().toISOString() }));
    setItem(key, Array.from(logMap.values()));
  }

  static deleteLog(id: string, userId?: string | null): void {
    const key = getCacheKey(KEYS.LOGS, userId);
    const logs = getItem<HabitLog[]>(key, []).filter((l) => l.id !== id);
    setItem(key, logs);
  }

  // --- Goals ---
  static getGoals(): Goal[] {
    return getItem<Goal[]>(KEYS.GOALS, []);
  }

  static saveGoal(goal: Goal): Goal {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    let updated: Goal[];
    if (idx >= 0) {
      goals[idx] = { ...goal, updatedDate: new Date().toISOString() };
      updated = [...goals];
    } else {
      updated = [...goals, goal];
    }
    setItem(KEYS.GOALS, updated);
    return goal;
  }

  static deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    setItem(KEYS.GOALS, goals);
  }

  // --- Reflections ---
  static getReflections(): Reflection[] {
    return getItem<Reflection[]>(KEYS.REFLECTIONS, []);
  }

  static saveReflection(reflection: Reflection): Reflection {
    const reflections = this.getReflections();
    const idx = reflections.findIndex((r) => r.id === reflection.id);
    let updated: Reflection[];
    if (idx >= 0) {
      reflections[idx] = { ...reflection, updatedDate: new Date().toISOString() };
      updated = [...reflections];
    } else {
      updated = [...reflections, reflection];
    }
    setItem(KEYS.REFLECTIONS, updated);
    return reflection;
  }

  static deleteReflection(id: string): void {
    const reflections = this.getReflections().filter((r) => r.id !== id);
    setItem(KEYS.REFLECTIONS, reflections);
  }

  // --- Learning Items ---
  static getLearningItems(): LearningItem[] {
    return getItem<LearningItem[]>(KEYS.LEARNING, []);
  }

  static saveLearningItem(item: LearningItem): LearningItem {
    const items = this.getLearningItems();
    const idx = items.findIndex((i) => i.id === item.id);
    let updated: LearningItem[];
    if (idx >= 0) {
      items[idx] = { ...item, updatedDate: new Date().toISOString() };
      updated = [...items];
    } else {
      updated = [...items, item];
    }
    setItem(KEYS.LEARNING, updated);
    return item;
  }

  static deleteLearningItem(id: string): void {
    const items = this.getLearningItems().filter((i) => i.id !== id);
    setItem(KEYS.LEARNING, items);
  }

  // --- Tasks ---
  static getTasks(): TaskItem[] {
    return getItem<TaskItem[]>(KEYS.TASKS, []);
  }

  static saveTask(task: TaskItem): TaskItem {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    let updated: TaskItem[];
    if (idx >= 0) {
      tasks[idx] = { ...task, updatedDate: new Date().toISOString() };
      updated = [...tasks];
    } else {
      updated = [...tasks, task];
    }
    setItem(KEYS.TASKS, updated);
    return task;
  }

  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    setItem(KEYS.TASKS, tasks);
  }

  // --- Expenses ---
  static getExpenses(): ExpenseTransaction[] {
    return getItem<ExpenseTransaction[]>(KEYS.EXPENSES, []);
  }

  static saveExpense(expense: ExpenseTransaction): ExpenseTransaction {
    const expenses = this.getExpenses();
    const idx = expenses.findIndex((e) => e.id === expense.id);
    let updated: ExpenseTransaction[];
    if (idx >= 0) {
      expenses[idx] = { ...expense, updatedDate: new Date().toISOString() };
      updated = [...expenses];
    } else {
      updated = [...expenses, expense];
    }
    setItem(KEYS.EXPENSES, updated);
    return expense;
  }

  static deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter((e) => e.id !== id);
    setItem(KEYS.EXPENSES, expenses);
  }

  // --- Notes ---
  static getNotes(): Note[] {
    return getItem<Note[]>(KEYS.NOTES, []);
  }

  static saveNote(note: Note): Note {
    const notes = this.getNotes();
    const idx = notes.findIndex((n) => n.id === note.id);
    let updated: Note[];
    if (idx >= 0) {
      notes[idx] = { ...note, updatedDate: new Date().toISOString() };
      updated = [...notes];
    } else {
      updated = [...notes, note];
    }
    setItem(KEYS.NOTES, updated);
    return note;
  }

  static deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    setItem(KEYS.NOTES, notes);
  }

  // --- Settings ---
  static getSettings(): AppSettings {
    return getItem<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  static saveSettings(settings: AppSettings): AppSettings {
    setItem(KEYS.SETTINGS, settings);
    return settings;
  }

  // --- Data Export & Import ---
  static exportFullBackupJSON(): string {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      challenges: this.getChallenges(),
      habits: this.getHabits(),
      trackers: this.getTrackers(),
      logs: this.getLogs(),
      goals: this.getGoals(),
      reflections: this.getReflections(),
      learning: this.getLearningItems(),
      expenses: this.getExpenses(),
      notes: this.getNotes(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backupData, null, 2);
  }

  static exportDailyLogsCSV(): string {
    const trackers = this.getTrackers();
    const habits = this.getHabits();
    const logs = this.getLogs();

    const habitMap = new Map(habits.map((h) => [h.id, h.name]));
    const headers = ['Date', 'Day Number', 'Completion %', 'Habit', 'Completed', 'Numeric Value', 'Duration (mins)', 'Notes'];

    const rows: string[] = [headers.join(',')];

    trackers.sort((a, b) => a.dayNumber - b.dayNumber).forEach((tracker) => {
      const trackerLogs = logs.filter((l) => l.dailyTrackerId === tracker.id);
      trackerLogs.forEach((l) => {
        const habitName = habitMap.get(l.habitId) || l.habitId;
        const row = [
          tracker.date,
          tracker.dayNumber,
          `${tracker.completionPercentage}%`,
          `"${habitName.replace(/"/g, '""')}"`,
          l.completed ? 'TRUE' : 'FALSE',
          l.numericValue ?? '',
          l.duration ?? '',
          `"${(tracker.notes || '').replace(/"/g, '""')}"`,
        ];
        rows.push(row.join(','));
      });
    });

    return rows.join('\n');
  }

  static importFullBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }

      if (Array.isArray(parsed.challenges)) setItem(KEYS.CHALLENGES, parsed.challenges);
      if (Array.isArray(parsed.habits)) setItem(KEYS.HABITS, parsed.habits);
      if (Array.isArray(parsed.trackers)) setItem(KEYS.TRACKERS, parsed.trackers);
      if (Array.isArray(parsed.logs)) setItem(KEYS.LOGS, parsed.logs);
      if (Array.isArray(parsed.goals)) setItem(KEYS.GOALS, parsed.goals);
      if (Array.isArray(parsed.reflections)) setItem(KEYS.REFLECTIONS, parsed.reflections);
      if (Array.isArray(parsed.learning)) setItem(KEYS.LEARNING, parsed.learning);
      if (Array.isArray(parsed.expenses)) setItem(KEYS.EXPENSES, parsed.expenses);
      if (Array.isArray(parsed.notes)) setItem(KEYS.NOTES, parsed.notes);
      if (parsed.settings && typeof parsed.settings === 'object') setItem(KEYS.SETTINGS, parsed.settings);

      return { success: true, message: 'Data imported successfully!' };
    } catch (err) {
      return { success: false, message: `Failed to import JSON: ${(err as Error).message}` };
    }
  }

  // --- Reset & Clear ---
  static resetToNewChallenge(name: string = '90-Day Upgrade', startDateStr?: string): Challenge {
    const start = startDateStr || new Date().toISOString().split('T')[0];
    const startDate = new Date(start);
    const endDateObj = new Date(startDate);
    endDateObj.setDate(endDateObj.getDate() + 89);
    const endDate = endDateObj.toISOString().split('T')[0];

    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      name,
      startDate: start,
      endDate,
      description: '90-day disciplined personal growth journey.',
      status: 'Active',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    // Keep habits, reset daily trackers, logs, tasks, and mark settings as real (non-demo) mode
    setItem(KEYS.CHALLENGES, [newChallenge]);
    setItem(KEYS.TRACKERS, []);
    setItem(KEYS.LOGS, []);
    setItem(KEYS.GOALS, []);
    setItem(KEYS.REFLECTIONS, []);
    setItem(KEYS.LEARNING, []);
    setItem(KEYS.TASKS, []);

    // Clear habitService caches
    localStorage.removeItem('life_upgrade_completions_cache');
    localStorage.removeItem('life_upgrade_challenge_cache');
    localStorage.removeItem('life_upgrade_tasks_cache');
    
    const settings = this.getSettings();
    settings.isDemoMode = false;
    setItem(KEYS.SETTINGS, settings);

    return newChallenge;
  }

  static clearAllData(): void {
    localStorage.removeItem(KEYS.CHALLENGES);
    localStorage.removeItem(KEYS.HABITS);
    localStorage.removeItem(KEYS.TRACKERS);
    localStorage.removeItem(KEYS.LOGS);
    localStorage.removeItem(KEYS.GOALS);
    localStorage.removeItem(KEYS.REFLECTIONS);
    localStorage.removeItem(KEYS.LEARNING);
    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.EXPENSES);
    localStorage.removeItem(KEYS.NOTES);

    // Clear habitService caches
    localStorage.removeItem('life_upgrade_habits_cache');
    localStorage.removeItem('life_upgrade_completions_cache');
    localStorage.removeItem('life_upgrade_challenge_cache');
    localStorage.removeItem('life_upgrade_tasks_cache');
    localStorage.removeItem('life_upgrade_expenses_cache');
    localStorage.removeItem('life_upgrade_notes_cache');
    localStorage.removeItem('life_upgrade_pending_sync_queue');
  }
}
