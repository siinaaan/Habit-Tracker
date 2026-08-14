import type {
  Challenge,
  Habit,
  DailyTracker,
  HabitLog,
  Goal,
  Reflection,
  LearningItem,
  AppSettings,
} from '../types';
import { DEFAULT_HABITS } from '../constants/defaultHabits';
import {
  DEMO_CHALLENGE,
  DEMO_SETTINGS,
  DEMO_GOALS,
  DEMO_REFLECTIONS,
  DEMO_LEARNING,
  generateDemoDailyData,
} from '../constants/initialDemoData';

const KEYS = {
  CHALLENGES: 'life_upgrade_challenges',
  HABITS: 'life_upgrade_habits',
  TRACKERS: 'life_upgrade_trackers',
  LOGS: 'life_upgrade_logs',
  GOALS: 'life_upgrade_goals',
  REFLECTIONS: 'life_upgrade_reflections',
  LEARNING: 'life_upgrade_learning',
  SETTINGS: 'life_upgrade_settings',
};

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

export class StorageService {
  // Initialize storage with Demo Data if empty
  static initializeStorage(): void {
    const existingChallenges = localStorage.getItem(KEYS.CHALLENGES);
    if (!existingChallenges) {
      console.log('Initializing application with default demo data...');
      const { trackers, logs } = generateDemoDailyData();
      
      setItem(KEYS.CHALLENGES, [DEMO_CHALLENGE]);
      setItem(KEYS.HABITS, DEFAULT_HABITS);
      setItem(KEYS.TRACKERS, trackers);
      setItem(KEYS.LOGS, logs);
      setItem(KEYS.GOALS, DEMO_GOALS);
      setItem(KEYS.REFLECTIONS, DEMO_REFLECTIONS);
      setItem(KEYS.LEARNING, DEMO_LEARNING);
      setItem(KEYS.SETTINGS, DEMO_SETTINGS);
    }
  }

  // --- Challenges ---
  static getChallenges(): Challenge[] {
    return getItem<Challenge[]>(KEYS.CHALLENGES, []);
  }

  static getActiveChallenge(): Challenge | null {
    const challenges = this.getChallenges();
    return challenges.find((c) => c.status === 'Active') || challenges[0] || null;
  }

  static saveChallenge(challenge: Challenge): Challenge {
    const challenges = this.getChallenges();
    const idx = challenges.findIndex((c) => c.id === challenge.id);
    let updated: Challenge[];
    if (idx >= 0) {
      challenges[idx] = { ...challenge, updatedDate: new Date().toISOString() };
      updated = [...challenges];
    } else {
      updated = [...challenges, challenge];
    }
    setItem(KEYS.CHALLENGES, updated);
    return challenge;
  }

  static deleteChallenge(id: string): void {
    const challenges = this.getChallenges().filter((c) => c.id !== id);
    setItem(KEYS.CHALLENGES, challenges);
  }

  // --- Habits ---
  static getHabits(): Habit[] {
    return getItem<Habit[]>(KEYS.HABITS, DEFAULT_HABITS);
  }

  static saveHabit(habit: Habit): Habit {
    const habits = this.getHabits();
    const idx = habits.findIndex((h) => h.id === habit.id);
    let updated: Habit[];
    if (idx >= 0) {
      habits[idx] = { ...habit, updatedDate: new Date().toISOString() };
      updated = [...habits];
    } else {
      updated = [...habits, habit];
    }
    setItem(KEYS.HABITS, updated);
    return habit;
  }

  static saveHabits(habits: Habit[]): void {
    setItem(KEYS.HABITS, habits);
  }

  static deleteHabit(id: string): void {
    const habits = this.getHabits().filter((h) => h.id !== id);
    setItem(KEYS.HABITS, habits);
  }

  // --- Daily Trackers ---
  static getTrackers(): DailyTracker[] {
    return getItem<DailyTracker[]>(KEYS.TRACKERS, []);
  }

  static saveTracker(tracker: DailyTracker): DailyTracker {
    const trackers = this.getTrackers();
    const idx = trackers.findIndex((t) => t.id === tracker.id);
    let updated: DailyTracker[];
    if (idx >= 0) {
      trackers[idx] = { ...tracker, updatedDate: new Date().toISOString() };
      updated = [...trackers];
    } else {
      updated = [...trackers, tracker];
    }
    setItem(KEYS.TRACKERS, updated);
    return tracker;
  }

  static deleteTracker(id: string): void {
    const trackers = this.getTrackers().filter((t) => t.id !== id);
    setItem(KEYS.TRACKERS, trackers);

    // Clean up habit logs associated with this tracker
    const logs = this.getLogs().filter((l) => l.dailyTrackerId !== id);
    setItem(KEYS.LOGS, logs);
  }

  // --- Habit Logs ---
  static getLogs(): HabitLog[] {
    return getItem<HabitLog[]>(KEYS.LOGS, []);
  }

  static saveLog(log: HabitLog): HabitLog {
    const logs = this.getLogs();
    const idx = logs.findIndex((l) => l.id === log.id);
    let updated: HabitLog[];
    if (idx >= 0) {
      logs[idx] = { ...log, updatedDate: new Date().toISOString() };
      updated = [...logs];
    } else {
      updated = [...logs, log];
    }
    setItem(KEYS.LOGS, updated);
    return log;
  }

  static saveLogs(newLogs: HabitLog[]): void {
    const existingLogs = this.getLogs();
    const logMap = new Map<string, HabitLog>(existingLogs.map((l) => [l.id, l]));
    newLogs.forEach((l) => logMap.set(l.id, { ...l, updatedDate: new Date().toISOString() }));
    setItem(KEYS.LOGS, Array.from(logMap.values()));
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

  // --- Settings ---
  static getSettings(): AppSettings {
    return getItem<AppSettings>(KEYS.SETTINGS, DEMO_SETTINGS);
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

    // Keep habits, reset daily trackers, logs, and mark settings as real (non-demo) mode
    setItem(KEYS.CHALLENGES, [newChallenge]);
    setItem(KEYS.TRACKERS, []);
    setItem(KEYS.LOGS, []);
    setItem(KEYS.GOALS, []);
    setItem(KEYS.REFLECTIONS, []);
    setItem(KEYS.LEARNING, []);
    
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
    localStorage.removeItem(KEYS.SETTINGS);
  }
}
