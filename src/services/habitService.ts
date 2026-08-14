import { supabase, isSupabaseConfigured } from './supabase';
import type { Habit, HabitLog, Challenge, TaskItem } from '../types';
import { DEFAULT_HABITS } from '../constants/defaultHabits';
import { generateDemoDailyData } from '../constants/initialDemoData';
import { StorageService } from './storage';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface PendingSyncItem {
  id: string;
  table: 'habits' | 'habit_completions' | 'challenge_progress' | 'tasks';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
}

const STORAGE_KEYS = {
  HABITS: 'life_upgrade_habits_cache',
  COMPLETIONS: 'life_upgrade_completions_cache',
  CHALLENGE: 'life_upgrade_challenge_cache',
  TASKS: 'life_upgrade_tasks_cache',
  PENDING_SYNC: 'life_upgrade_pending_sync_queue',
};

// Safe JSON Helper
function getLocalCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from local cache:`, err);
    return fallback;
  }
}

function setLocalCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to local cache:`, err);
  }
}

class HabitService {
  private syncState: SyncState = navigator.onLine ? 'synced' : 'offline';
  private syncListeners: ((state: SyncState) => void)[] = [];
  private isSyncing = false;

  constructor() {
    // Register network status listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setSyncState('syncing');
        this.syncPendingChanges();
      });
      window.addEventListener('offline', () => {
        this.setSyncState('offline');
      });
    }
  }

  // --- Sync Listener Registration ---
  public subscribeSyncState(listener: (state: SyncState) => void): () => void {
    this.syncListeners.push(listener);
    listener(this.syncState);
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener);
    };
  }

  public getSyncState(): SyncState {
    return this.syncState;
  }

  private setSyncState(state: SyncState): void {
    this.syncState = state;
    this.syncListeners.forEach((listener) => listener(state));
  }

  // --- Pending Sync Queue Operations ---
  private getPendingQueue(): PendingSyncItem[] {
    return getLocalCache<PendingSyncItem[]>(STORAGE_KEYS.PENDING_SYNC, []);
  }

  private enqueuePending(item: Omit<PendingSyncItem, 'timestamp'>): void {
    const queue = this.getPendingQueue();
    // Avoid duplicate pending actions for same item if updating multiple times
    const filtered = queue.filter(
      (q) => !(q.id === item.id && q.table === item.table && q.action === item.action)
    );
    filtered.push({ ...item, timestamp: Date.now() });
    setLocalCache(STORAGE_KEYS.PENDING_SYNC, filtered);
  }

  public async syncPendingChanges(): Promise<void> {
    if (!navigator.onLine || !isSupabaseConfigured() || this.isSyncing) {
      if (!navigator.onLine) this.setSyncState('offline');
      return;
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      this.setSyncState('synced');
      return;
    }

    this.isSyncing = true;
    this.setSyncState('syncing');

    const remainingQueue: PendingSyncItem[] = [];

    for (const item of queue) {
      try {
        let error: any = null;
        if (item.action === 'INSERT' || item.action === 'UPDATE') {
          const { error: err } = await supabase.from(item.table).upsert(item.payload);
          error = err;
        } else if (item.action === 'DELETE') {
          const { error: err } = await supabase.from(item.table).delete().eq('id', item.id);
          error = err;
        }

        if (error) {
          console.warn(`Sync failed for item ${item.id} on table ${item.table}:`, error);
          remainingQueue.push(item);
        }
      } catch (err) {
        console.error(`Error during sync execution:`, err);
        remainingQueue.push(item);
      }
    }

    setLocalCache(STORAGE_KEYS.PENDING_SYNC, remainingQueue);
    this.isSyncing = false;

    if (remainingQueue.length > 0) {
      this.setSyncState('error');
    } else {
      this.setSyncState('synced');
      // Refresh local cache with latest data from Supabase
      await this.refreshRemoteToLocalCache();
    }
  }

  private async refreshRemoteToLocalCache(): Promise<void> {
    if (!navigator.onLine || !isSupabaseConfigured()) return;
    try {
      // Sync Habits
      const { data: habitsData } = await supabase.from('habits').select('*');
      if (habitsData && habitsData.length > 0) {
        setLocalCache(STORAGE_KEYS.HABITS, habitsData.map(this.mapDbToHabit));
      }

      // Sync Completions
      const { data: completionsData } = await supabase.from('habit_completions').select('*');
      if (completionsData && completionsData.length > 0) {
        setLocalCache(STORAGE_KEYS.COMPLETIONS, completionsData.map(this.mapDbToCompletion));
      }

      // Sync Challenge
      const { data: challengeData } = await supabase.from('challenge_progress').select('*');
      if (challengeData && challengeData.length > 0) {
        setLocalCache(STORAGE_KEYS.CHALLENGE, challengeData.map(this.mapDbToChallenge));
      }

      // Sync Tasks
      const { data: tasksData } = await supabase.from('tasks').select('*');
      if (tasksData && tasksData.length > 0) {
        setLocalCache(STORAGE_KEYS.TASKS, tasksData.map(this.mapDbToTask));
      }
    } catch (err) {
      console.warn('Could not refresh remote cache from Supabase:', err);
    }
  }

  // --- DB Schema Converters (Handling camelCase & snake_case) ---
  private mapDbToTask(row: any): TaskItem {
    return {
      id: row.id,
      title: row.title || '',
      description: row.description || '',
      category: row.category || 'General',
      priority: (row.priority as any) || 'Medium',
      dueDate: row.due_date || row.dueDate || new Date().toISOString().split('T')[0],
      dueTime: row.due_time || row.dueTime || '',
      repeatType: (row.repeat_type || row.repeatType || 'None') as any,
      habitId: row.habit_id || row.habitId || null,
      completed: !!row.completed,
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapTaskToDb(t: TaskItem): any {
    return {
      id: t.id,
      title: t.title,
      description: t.description || null,
      category: t.category,
      priority: t.priority,
      due_date: t.dueDate,
      due_time: t.dueTime || null,
      repeat_type: t.repeatType,
      habit_id: t.habitId || null,
      completed: t.completed,
      created_at: t.createdDate,
      updated_at: t.updatedDate,
    };
  }

  // --- DB Schema Converters (Handling camelCase & snake_case) ---
  private mapDbToHabit(row: any): Habit {
    return {
      id: row.id,
      name: row.name || '',
      description: row.description || '',
      category: row.category || 'Custom',
      icon: row.icon || '⚡',
      type: row.type || 'checkbox',
      target: Number(row.target ?? 1),
      unit: row.unit || 'bool',
      frequency: row.frequency || 'daily',
      active: row.active ?? true,
      order: Number(row.order ?? 0),
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapHabitToDb(h: Habit): any {
    return {
      id: h.id,
      name: h.name,
      description: h.description,
      category: h.category,
      icon: h.icon,
      type: h.type,
      target: h.target,
      unit: h.unit,
      frequency: h.frequency,
      active: h.active,
      order: h.order,
      created_at: h.createdDate,
      updated_at: h.updatedDate,
    };
  }

  private mapDbToCompletion(row: any): HabitLog {
    return {
      id: row.id,
      habitId: row.habit_id || row.habitId || '',
      dailyTrackerId: row.daily_tracker_id || row.dailyTrackerId || row.date || '',
      completed: !!row.completed,
      numericValue: row.numeric_value ?? row.numericValue ?? null,
      duration: row.duration ?? null,
      timeValue: row.time_value ?? row.timeValue ?? null,
      notes: row.notes || '',
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapCompletionToDb(c: HabitLog): any {
    return {
      id: c.id,
      habit_id: c.habitId,
      daily_tracker_id: c.dailyTrackerId,
      completed: c.completed,
      numeric_value: c.numericValue,
      duration: c.duration,
      time_value: c.timeValue,
      notes: c.notes,
      created_at: c.createdDate,
      updated_at: c.updatedDate,
    };
  }

  private mapDbToChallenge(row: any): Challenge {
    return {
      id: row.id,
      name: row.name || '90-Day Challenge',
      startDate: row.start_date || row.startDate || new Date().toISOString().split('T')[0],
      endDate: row.end_date || row.endDate || new Date().toISOString().split('T')[0],
      description: row.description || '',
      status: row.status || 'Active',
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapChallengeToDb(ch: Challenge): any {
    return {
      id: ch.id,
      name: ch.name,
      start_date: ch.startDate,
      end_date: ch.endDate,
      description: ch.description,
      status: ch.status,
      created_at: ch.createdDate,
      updated_at: ch.updatedDate,
    };
  }

  // ==========================================
  // 1. HABITS CRUD
  // ==========================================
  public async getHabits(): Promise<Habit[]> {
    let localHabits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, []);
    if (!localHabits.length) {
      localHabits = DEFAULT_HABITS;
      setLocalCache(STORAGE_KEYS.HABITS, localHabits);
    }

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('habits').select('*').order('order', { ascending: true });
        if (!error && data && data.length > 0) {
          const remoteHabits = data.map(this.mapDbToHabit);
          setLocalCache(STORAGE_KEYS.HABITS, remoteHabits);
          this.setSyncState('synced');
          return remoteHabits;
        }
      } catch (err) {
        console.warn('Supabase fetch habits failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return localHabits;
  }

  public async getHabitById(id: string): Promise<Habit | null> {
    const habits = await this.getHabits();
    return habits.find((h) => h.id === id) || null;
  }

  public async createHabit(habit: Habit): Promise<Habit> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const updated = [...habits.filter((h) => h.id !== habit.id), habit];
    setLocalCache(STORAGE_KEYS.HABITS, updated);

    const payload = this.mapHabitToDb(habit);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habits').insert(payload);
        if (error) {
          console.warn('Supabase createHabit error, queueing pending sync:', error);
          this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload });
      this.setSyncState('offline');
    }

    return habit;
  }

  public async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const existing = habits.find((h) => h.id === id);
    if (!existing) return null;

    const updatedHabit: Habit = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = habits.map((h) => (h.id === id ? updatedHabit : h));
    setLocalCache(STORAGE_KEYS.HABITS, newList);

    const payload = this.mapHabitToDb(updatedHabit);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habits').update(payload).eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload });
      this.setSyncState('offline');
    }

    return updatedHabit;
  }

  public async deleteHabit(id: string): Promise<boolean> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const filtered = habits.filter((h) => h.id !== id);
    setLocalCache(STORAGE_KEYS.HABITS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null });
      this.setSyncState('offline');
    }

    return true;
  }

  // ==========================================
  // 2. COMPLETIONS (HABIT LOGS) CRUD
  // ==========================================
  public async getHabitCompletions(habitId?: string): Promise<HabitLog[]> {
    let localCompletions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);

    if (!localCompletions.length) {
      const settings = StorageService.getSettings();
      if (settings && settings.isDemoMode) {
        const demoData = generateDemoDailyData();
        localCompletions = demoData.logs;
        setLocalCache(STORAGE_KEYS.COMPLETIONS, localCompletions);
      }
    }

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        let query = supabase.from('habit_completions').select('*');
        if (habitId) query = query.eq('habit_id', habitId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const remoteLogs = data.map(this.mapDbToCompletion);
          setLocalCache(STORAGE_KEYS.COMPLETIONS, remoteLogs);
          this.setSyncState('synced');
          return habitId ? remoteLogs.filter((l) => l.habitId === habitId) : remoteLogs;
        }
      } catch (err) {
        console.warn('Supabase fetch completions failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return habitId
      ? localCompletions.filter((l) => l.habitId === habitId)
      : localCompletions;
  }

  public async getCompletionsByDate(dateStr: string): Promise<HabitLog[]> {
    const all = await this.getHabitCompletions();
    return all.filter((l) => l.dailyTrackerId === dateStr || l.dailyTrackerId === `tracker-${dateStr}` || l.dailyTrackerId.includes(dateStr));
  }

  public async createCompletion(completion: HabitLog): Promise<HabitLog> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const updated = [...completions.filter((c) => c.id !== completion.id), completion];
    setLocalCache(STORAGE_KEYS.COMPLETIONS, updated);

    const payload = this.mapCompletionToDb(completion);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habit_completions').insert(payload);
        if (error) {
          this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload });
      this.setSyncState('offline');
    }

    return completion;
  }

  public async updateCompletion(id: string, updates: Partial<HabitLog>): Promise<HabitLog | null> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const existing = completions.find((c) => c.id === id);
    if (!existing) return null;

    const updatedLog: HabitLog = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = completions.map((c) => (c.id === id ? updatedLog : c));
    setLocalCache(STORAGE_KEYS.COMPLETIONS, newList);

    const payload = this.mapCompletionToDb(updatedLog);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habit_completions').upsert(payload);
        if (error) {
          this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload });
      this.setSyncState('offline');
    }

    return updatedLog;
  }

  public async deleteCompletion(id: string): Promise<boolean> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const filtered = completions.filter((c) => c.id !== id);
    setLocalCache(STORAGE_KEYS.COMPLETIONS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habit_completions').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null });
      this.setSyncState('offline');
    }

    return true;
  }

  // ==========================================
  // 3. CHALLENGE PROGRESS CRUD
  // ==========================================
  public async getChallengeProgress(): Promise<Challenge | null> {
    const storageChallenges = StorageService.getChallenges();
    let localChallenges = getLocalCache<Challenge[]>(STORAGE_KEYS.CHALLENGE, storageChallenges);
    let active = localChallenges.find((c) => c.status === 'Active') || localChallenges[0] || StorageService.getActiveChallenge();

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('challenge_progress').select('*');
        if (!error && data && data.length > 0) {
          const remoteChallenges = data.map(this.mapDbToChallenge);
          setLocalCache(STORAGE_KEYS.CHALLENGE, remoteChallenges);
          this.setSyncState('synced');
          return remoteChallenges.find((c) => c.status === 'Active') || remoteChallenges[0];
        }
      } catch (err) {
        console.warn('Supabase fetch challenge progress failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return active;
  }

  public async createChallengeProgress(data: Challenge): Promise<Challenge> {
    const list = getLocalCache<Challenge[]>(STORAGE_KEYS.CHALLENGE, []);
    const updated = [...list.filter((c) => c.id !== data.id), data];
    setLocalCache(STORAGE_KEYS.CHALLENGE, updated);

    const payload = this.mapChallengeToDb(data);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('challenge_progress').insert(payload);
        if (error) {
          this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload });
      this.setSyncState('offline');
    }

    return data;
  }

  public async updateChallengeProgress(id: string, updates: Partial<Challenge>): Promise<Challenge | null> {
    const list = getLocalCache<Challenge[]>(STORAGE_KEYS.CHALLENGE, []);
    const existing = list.find((c) => c.id === id);
    if (!existing) return null;

    const updatedChallenge: Challenge = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = list.map((c) => (c.id === id ? updatedChallenge : c));
    setLocalCache(STORAGE_KEYS.CHALLENGE, newList);

    const payload = this.mapChallengeToDb(updatedChallenge);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('challenge_progress').upsert(payload);
        if (error) {
          this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload });
      this.setSyncState('offline');
    }

    return updatedChallenge;
  }
  // ==========================================
  // 4. TASKS CRUD
  // ==========================================
  public async getTasks(): Promise<TaskItem[]> {
    let localTasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const remoteTasks = data.map(this.mapDbToTask);
          setLocalCache(STORAGE_KEYS.TASKS, remoteTasks);
          this.setSyncState('synced');
          return remoteTasks;
        }
      } catch (err) {
        console.warn('Supabase fetch tasks failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return localTasks;
  }

  public async getTaskById(id: string): Promise<TaskItem | null> {
    const tasks = await this.getTasks();
    return tasks.find((t) => t.id === id) || null;
  }

  public async createTask(task: TaskItem): Promise<TaskItem> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const updated = [...tasks.filter((t) => t.id !== task.id), task];
    setLocalCache(STORAGE_KEYS.TASKS, updated);

    const payload = this.mapTaskToDb(task);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('tasks').insert(payload);
        if (error) {
          console.warn('Supabase createTask error, queueing pending sync:', error);
          this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload });
      this.setSyncState('offline');
    }

    return task;
  }

  public async updateTask(id: string, updates: Partial<TaskItem>): Promise<TaskItem | null> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return null;

    const updatedTask: TaskItem = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = tasks.map((t) => (t.id === id ? updatedTask : t));
    setLocalCache(STORAGE_KEYS.TASKS, newList);

    const payload = this.mapTaskToDb(updatedTask);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('tasks').upsert(payload);
        if (error) {
          this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload });
      this.setSyncState('offline');
    }

    return updatedTask;
  }

  public async deleteTask(id: string): Promise<boolean> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const filtered = tasks.filter((t) => t.id !== id);
    setLocalCache(STORAGE_KEYS.TASKS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null });
          this.setSyncState('error');
        } else {
          this.setSyncState('synced');
        }
      } catch (err) {
        this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null });
        this.setSyncState('error');
      }
    } else {
      this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null });
      this.setSyncState('offline');
    }

    return true;
  }

  public clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGE);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  }
}

export const habitService = new HabitService();
