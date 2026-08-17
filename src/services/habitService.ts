import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Habit, HabitLog, Challenge, TaskItem, ExpenseTransaction } from '../types';
import { DEFAULT_HABITS } from '../constants/defaultHabits';
import { generateDemoDailyData } from '../constants/initialDemoData';
import { StorageService } from './storage';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface PendingSyncItem {
  id: string;
  table: 'habits' | 'habit_completions' | 'challenge_progress' | 'tasks' | 'expenses';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  userId?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  HABITS: 'life_upgrade_habits_cache',
  COMPLETIONS: 'life_upgrade_completions_cache',
  CHALLENGE: 'life_upgrade_challenge_cache',
  TASKS: 'life_upgrade_tasks_cache',
  EXPENSES: 'life_upgrade_expenses_cache',
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
  private realtimeChannel: RealtimeChannel | null = null;
  private onRemoteChangeCallback: (() => void) | null = null;
  private remoteChangeDebounceTimer: any = null;

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

  // --- Realtime Subscriptions ---
  public setRemoteChangeCallback(callback: (() => void) | null): void {
    this.onRemoteChangeCallback = callback;
  }

  private triggerRemoteChangeCallback(): void {
    if (!this.onRemoteChangeCallback) return;
    if (this.remoteChangeDebounceTimer) {
      clearTimeout(this.remoteChangeDebounceTimer);
    }
    this.remoteChangeDebounceTimer = setTimeout(() => {
      if (this.onRemoteChangeCallback) {
        this.onRemoteChangeCallback();
      }
    }, 150);
  }

  public async setupRealtimeSubscriptions(userId: string): Promise<void> {
    if (!isSupabaseConfigured() || !userId) return;

    this.unsubscribeRealtime();

    try {
      const channelName = `realtime_user_${userId}`;
      this.realtimeChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habits' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'habit_completions' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Supabase Realtime connected successfully for user: ${userId}`);
          } else if (err) {
            console.warn(`Supabase Realtime subscription status [${status}]:`, err);
          }
        });
    } catch (err) {
      console.warn('Error setting up Supabase Realtime subscriptions:', err);
    }
  }

  public unsubscribeRealtime(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
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

  public async getAuthenticatedUserId(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id ?? null;
    } catch (err) {
      return null;
    }
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

    const currentUserId = await this.getAuthenticatedUserId();
    if (!currentUserId) {
      this.setSyncState('offline');
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
      // Security: Discard/skip queue item if created under a different user session
      if (item.userId && item.userId !== currentUserId) {
        console.warn(`Skipping pending queue item ${item.id} belonging to different user (${item.userId})`);
        continue;
      }

      // Explicitly attach active user_id to payload
      if (item.payload && typeof item.payload === 'object') {
        item.payload.user_id = currentUserId;
      }

      // Ensure parent habit exists in Supabase before syncing a completion
      if (item.table === 'habit_completions' && item.payload && item.payload.habit_id) {
        await this.ensureHabitExistsInSupabase(item.payload.habit_id, currentUserId);
      }

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
          console.warn(`Sync failed for item ${item.id} on table ${item.table}:`, error.message);
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

      // Sync Expenses
      const { data: expensesData } = await supabase.from('expenses').select('*');
      if (expensesData && expensesData.length > 0) {
        setLocalCache(STORAGE_KEYS.EXPENSES, expensesData.map(this.mapDbToExpense));
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

  private mapTaskToDb(t: TaskItem, userId?: string): any {
    const payload: any = {
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
    if (userId) payload.user_id = userId;
    return payload;
  }

  private mapDbToExpense(row: any): ExpenseTransaction {
    return {
      id: row.id,
      title: row.title || '',
      amount: Number(row.amount ?? 0),
      type: row.type || 'expense',
      category: row.category || 'Other',
      date: row.date || new Date().toISOString().split('T')[0],
      note: row.note || '',
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapExpenseToDb(e: ExpenseTransaction, userId?: string): any {
    const payload: any = {
      id: e.id,
      title: e.title,
      amount: e.amount,
      type: e.type,
      category: e.category,
      date: e.date,
      note: e.note || null,
      created_at: e.createdDate,
      updated_at: e.updatedDate,
    };
    if (userId) payload.user_id = userId;
    return payload;
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

  private mapHabitToDb(h: Habit, userId?: string): any {
    const payload: any = {
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
    if (userId) payload.user_id = userId;
    return payload;
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

  private mapCompletionToDb(c: HabitLog, userId?: string): any {
    const payload: any = {
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
    if (userId) payload.user_id = userId;
    return payload;
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

  private mapChallengeToDb(ch: Challenge, userId?: string): any {
    const payload: any = {
      id: ch.id,
      name: ch.name,
      start_date: ch.startDate,
      end_date: ch.endDate,
      description: ch.description,
      status: ch.status,
      created_at: ch.createdDate,
      updated_at: ch.updatedDate,
    };
    if (userId) payload.user_id = userId;
    return payload;
  }

  // ==========================================
  // 1. HABITS CRUD
  // ==========================================
  public async autoSeedDefaultHabits(userId: string): Promise<void> {
    if (!navigator.onLine || !isSupabaseConfigured() || !userId) return;
    try {
      const payloads = DEFAULT_HABITS.map((h) => this.mapHabitToDb(h, userId));
      const { error } = await supabase.from('habits').upsert(payloads);
      if (error) {
        console.warn('autoSeedDefaultHabits warning:', error.message);
      }
    } catch (err) {
      console.warn('autoSeedDefaultHabits error:', err);
    }
  }

  public async getHabits(): Promise<Habit[]> {
    let localHabits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, []);
    if (!localHabits.length) {
      localHabits = DEFAULT_HABITS;
      setLocalCache(STORAGE_KEYS.HABITS, localHabits);
    }

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const userId = await this.getAuthenticatedUserId();
        if (userId) {
          await this.autoSeedDefaultHabits(userId);
        }

        const { data, error } = await supabase.from('habits').select('*').order('order', { ascending: true });
        if (!error && data) {
          const remoteHabits = data.map(this.mapDbToHabit);
          const remoteIds = new Set(remoteHabits.map((h) => h.id));
          const pendingCustomLocal = localHabits.filter((h) => !remoteIds.has(h.id) && h.category === 'Custom');
          const mergedHabits = [...remoteHabits, ...pendingCustomLocal];
          setLocalCache(STORAGE_KEYS.HABITS, mergedHabits);
          this.setSyncState('synced');
          return mergedHabits;
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

  public async createHabit(habit: Habit): Promise<{ habit: Habit; synced: boolean; error?: string }> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const updated = [...habits.filter((h) => h.id !== habit.id), habit];
    setLocalCache(STORAGE_KEYS.HABITS, updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapHabitToDb(habit);
        this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { habit, synced: false, error: 'No active session' };
      }

      const payload = this.mapHabitToDb(habit, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('habits').insert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase createHabit error, queueing pending sync:', errMsg);
          this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { habit, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { habit, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { habit, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapHabitToDb(habit);
      this.enqueuePending({ id: habit.id, table: 'habits', action: 'INSERT', payload });
      this.setSyncState('offline');
      return { habit, synced: false };
    }
  }

  public async updateHabit(id: string, updates: Partial<Habit>): Promise<{ habit: Habit | null; synced: boolean; error?: string }> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const existing = habits.find((h) => h.id === id);
    if (!existing) return { habit: null, synced: false, error: 'Habit not found' };

    const updatedHabit: Habit = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = habits.map((h) => (h.id === id ? updatedHabit : h));
    setLocalCache(STORAGE_KEYS.HABITS, newList);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapHabitToDb(updatedHabit);
        this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { habit: updatedHabit, synced: false, error: 'No active session' };
      }

      const payload = this.mapHabitToDb(updatedHabit, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('habits').upsert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase updateHabit error:', errMsg);
          this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { habit: updatedHabit, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { habit: updatedHabit, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { habit: updatedHabit, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapHabitToDb(updatedHabit);
      this.enqueuePending({ id, table: 'habits', action: 'UPDATE', payload });
      this.setSyncState('offline');
      return { habit: updatedHabit, synced: false };
    }
  }

  public async deleteHabit(id: string): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    const filtered = habits.filter((h) => h.id !== id);
    setLocalCache(STORAGE_KEYS.HABITS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id, table: 'habits', action: 'DELETE', payload: null });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
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
        if (!error && data) {
          const remoteLogs = data.map(this.mapDbToCompletion);
          if (!habitId) {
            setLocalCache(STORAGE_KEYS.COMPLETIONS, remoteLogs);
          }
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

  private async ensureHabitExistsInSupabase(habitId: string, userId: string): Promise<void> {
    if (!navigator.onLine || !isSupabaseConfigured() || !userId || !habitId) return;

    const habits = getLocalCache<Habit[]>(STORAGE_KEYS.HABITS, DEFAULT_HABITS);
    let habit = habits.find((h) => h.id === habitId);
    if (!habit) {
      habit = DEFAULT_HABITS.find((h) => h.id === habitId);
    }
    if (!habit) return;

    const payload = this.mapHabitToDb(habit, userId);
    try {
      const { error } = await supabase.from('habits').upsert(payload);
      if (error) {
        console.warn(`ensureHabitExistsInSupabase failed for habit ${habitId}:`, error.message);
      }
    } catch (err) {
      console.warn(`ensureHabitExistsInSupabase error for habit ${habitId}:`, err);
    }
  }

  public async getCompletionsByDate(dateStr: string): Promise<HabitLog[]> {
    const all = await this.getHabitCompletions();
    return all.filter((l) => l.dailyTrackerId === dateStr || l.dailyTrackerId === `tracker-${dateStr}` || l.dailyTrackerId.includes(dateStr));
  }

  public async createCompletion(completion: HabitLog): Promise<{ completion: HabitLog; synced: boolean; error?: string }> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const updated = [...completions.filter((c) => c.id !== completion.id), completion];
    setLocalCache(STORAGE_KEYS.COMPLETIONS, updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapCompletionToDb(completion);
        this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { completion, synced: false, error: 'No active session' };
      }

      await this.ensureHabitExistsInSupabase(completion.habitId, userId);

      const payload = this.mapCompletionToDb(completion, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('habit_completions').insert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase createCompletion error:', errMsg);
          this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { completion, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { completion, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { completion, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapCompletionToDb(completion);
      this.enqueuePending({ id: completion.id, table: 'habit_completions', action: 'INSERT', payload });
      this.setSyncState('offline');
      return { completion, synced: false };
    }
  }

  public async updateCompletion(id: string, updates: Partial<HabitLog>): Promise<{ completion: HabitLog | null; synced: boolean; error?: string }> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const existing = completions.find((c) => c.id === id);
    if (!existing) return { completion: null, synced: false, error: 'Completion log not found' };

    const updatedLog: HabitLog = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = completions.map((c) => (c.id === id ? updatedLog : c));
    setLocalCache(STORAGE_KEYS.COMPLETIONS, newList);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapCompletionToDb(updatedLog);
        this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { completion: updatedLog, synced: false, error: 'No active session' };
      }

      await this.ensureHabitExistsInSupabase(updatedLog.habitId, userId);

      const payload = this.mapCompletionToDb(updatedLog, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('habit_completions').upsert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase updateCompletion error:', errMsg);
          this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { completion: updatedLog, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { completion: updatedLog, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { completion: updatedLog, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapCompletionToDb(updatedLog);
      this.enqueuePending({ id, table: 'habit_completions', action: 'UPDATE', payload });
      this.setSyncState('offline');
      return { completion: updatedLog, synced: false };
    }
  }

  public async deleteCompletion(id: string): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const completions = getLocalCache<HabitLog[]>(STORAGE_KEYS.COMPLETIONS, []);
    const filtered = completions.filter((c) => c.id !== id);
    setLocalCache(STORAGE_KEYS.COMPLETIONS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('habit_completions').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id, table: 'habit_completions', action: 'DELETE', payload: null });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
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

  public async createChallengeProgress(data: Challenge): Promise<{ challenge: Challenge; synced: boolean; error?: string }> {
    const list = getLocalCache<Challenge[]>(STORAGE_KEYS.CHALLENGE, []);
    const updated = [...list.filter((c) => c.id !== data.id), data];
    setLocalCache(STORAGE_KEYS.CHALLENGE, updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapChallengeToDb(data);
        this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { challenge: data, synced: false, error: 'No active session' };
      }

      const payload = this.mapChallengeToDb(data, userId);
      try {
        this.setSyncState('syncing');
        const { data: resData, error } = await supabase.from('challenge_progress').insert(payload).select().single();
        if (error || !resData) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase createChallengeProgress error:', errMsg);
          this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { challenge: data, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { challenge: data, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { challenge: data, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapChallengeToDb(data);
      this.enqueuePending({ id: data.id, table: 'challenge_progress', action: 'INSERT', payload });
      this.setSyncState('offline');
      return { challenge: data, synced: false };
    }
  }

  public async updateChallengeProgress(id: string, updates: Partial<Challenge>): Promise<{ challenge: Challenge | null; synced: boolean; error?: string }> {
    const list = getLocalCache<Challenge[]>(STORAGE_KEYS.CHALLENGE, []);
    const existing = list.find((c) => c.id === id);
    if (!existing) return { challenge: null, synced: false, error: 'Challenge not found' };

    const updatedChallenge: Challenge = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = list.map((c) => (c.id === id ? updatedChallenge : c));
    setLocalCache(STORAGE_KEYS.CHALLENGE, newList);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapChallengeToDb(updatedChallenge);
        this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { challenge: updatedChallenge, synced: false, error: 'No active session' };
      }

      const payload = this.mapChallengeToDb(updatedChallenge, userId);
      try {
        this.setSyncState('syncing');
        const { data: resData, error } = await supabase.from('challenge_progress').upsert(payload).select().single();
        if (error || !resData) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase updateChallengeProgress error:', errMsg);
          this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { challenge: updatedChallenge, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { challenge: updatedChallenge, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { challenge: updatedChallenge, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapChallengeToDb(updatedChallenge);
      this.enqueuePending({ id, table: 'challenge_progress', action: 'UPDATE', payload });
      this.setSyncState('offline');
      return { challenge: updatedChallenge, synced: false };
    }
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

  public async createTask(task: TaskItem): Promise<{ task: TaskItem; synced: boolean; error?: string }> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const updated = [...tasks.filter((t) => t.id !== task.id), task];
    setLocalCache(STORAGE_KEYS.TASKS, updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapTaskToDb(task);
        this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { task, synced: false, error: 'No active session' };
      }

      const payload = this.mapTaskToDb(task, userId);
      try {
        this.setSyncState('syncing');
        const { data: resData, error } = await supabase.from('tasks').insert(payload).select().single();
        if (error || !resData) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase createTask error, queueing pending sync:', errMsg);
          this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { task, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { task, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { task, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapTaskToDb(task);
      this.enqueuePending({ id: task.id, table: 'tasks', action: 'INSERT', payload });
      this.setSyncState('offline');
      return { task, synced: false };
    }
  }

  public async updateTask(id: string, updates: Partial<TaskItem>): Promise<{ task: TaskItem | null; synced: boolean; error?: string }> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return { task: null, synced: false, error: 'Task not found' };

    const updatedTask: TaskItem = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = tasks.map((t) => (t.id === id ? updatedTask : t));
    setLocalCache(STORAGE_KEYS.TASKS, newList);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapTaskToDb(updatedTask);
        this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { task: updatedTask, synced: false, error: 'No active session' };
      }

      const payload = this.mapTaskToDb(updatedTask, userId);
      try {
        this.setSyncState('syncing');
        const { data: resData, error } = await supabase.from('tasks').upsert(payload).select().single();
        if (error || !resData) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase updateTask error:', errMsg);
          this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { task: updatedTask, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { task: updatedTask, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { task: updatedTask, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapTaskToDb(updatedTask);
      this.enqueuePending({ id, table: 'tasks', action: 'UPDATE', payload });
      this.setSyncState('offline');
      return { task: updatedTask, synced: false };
    }
  }

  public async deleteTask(id: string): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const tasks = getLocalCache<TaskItem[]>(STORAGE_KEYS.TASKS, []);
    const filtered = tasks.filter((t) => t.id !== id);
    setLocalCache(STORAGE_KEYS.TASKS, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id, table: 'tasks', action: 'DELETE', payload: null });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
  }

  // ==========================================
  // 5. EXPENSES CRUD
  // ==========================================
  public async getExpenses(): Promise<ExpenseTransaction[]> {
    let localExpenses = getLocalCache<ExpenseTransaction[]>(STORAGE_KEYS.EXPENSES, []);
    if (!localExpenses.length) {
      localExpenses = StorageService.getExpenses();
      if (localExpenses.length > 0) {
        setLocalCache(STORAGE_KEYS.EXPENSES, localExpenses);
      }
    }

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
        if (!error && data) {
          const remoteExpenses = data.map(this.mapDbToExpense);
          setLocalCache(STORAGE_KEYS.EXPENSES, remoteExpenses);
          this.setSyncState('synced');
          return remoteExpenses;
        }
      } catch (err) {
        console.warn('Supabase fetch expenses failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return localExpenses;
  }

  public async createExpense(expense: ExpenseTransaction): Promise<{ expense: ExpenseTransaction; synced: boolean; error?: string }> {
    const list = getLocalCache<ExpenseTransaction[]>(STORAGE_KEYS.EXPENSES, []);
    const updated = [expense, ...list.filter((e) => e.id !== expense.id)];
    setLocalCache(STORAGE_KEYS.EXPENSES, updated);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapExpenseToDb(expense);
        this.enqueuePending({ id: expense.id, table: 'expenses', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { expense, synced: false, error: 'No active session' };
      }

      const payload = this.mapExpenseToDb(expense, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('expenses').insert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase createExpense error:', errMsg);
          this.enqueuePending({ id: expense.id, table: 'expenses', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { expense, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { expense, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id: expense.id, table: 'expenses', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { expense, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapExpenseToDb(expense);
      this.enqueuePending({ id: expense.id, table: 'expenses', action: 'INSERT', payload });
      this.setSyncState('offline');
      return { expense, synced: false };
    }
  }

  public async updateExpense(id: string, updates: Partial<ExpenseTransaction>): Promise<{ expense: ExpenseTransaction | null; synced: boolean; error?: string }> {
    const list = getLocalCache<ExpenseTransaction[]>(STORAGE_KEYS.EXPENSES, []);
    const existing = list.find((e) => e.id === id);
    if (!existing) return { expense: null, synced: false, error: 'Expense transaction not found' };

    const updatedExpense: ExpenseTransaction = {
      ...existing,
      ...updates,
      updatedDate: new Date().toISOString(),
    };

    const newList = list.map((e) => (e.id === id ? updatedExpense : e));
    setLocalCache(STORAGE_KEYS.EXPENSES, newList);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        const payload = this.mapExpenseToDb(updatedExpense);
        this.enqueuePending({ id, table: 'expenses', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { expense: updatedExpense, synced: false, error: 'No active session' };
      }

      const payload = this.mapExpenseToDb(updatedExpense, userId);
      try {
        this.setSyncState('syncing');
        const { data, error } = await supabase.from('expenses').upsert(payload).select().single();
        if (error || !data) {
          const errMsg = error?.message || 'Row verification failed (no data returned)';
          console.warn('Supabase updateExpense error:', errMsg);
          this.enqueuePending({ id, table: 'expenses', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { expense: updatedExpense, synced: false, error: errMsg };
        } else {
          this.setSyncState('synced');
          return { expense: updatedExpense, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'expenses', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { expense: updatedExpense, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapExpenseToDb(updatedExpense);
      this.enqueuePending({ id, table: 'expenses', action: 'UPDATE', payload });
      this.setSyncState('offline');
      return { expense: updatedExpense, synced: false };
    }
  }

  public async deleteExpense(id: string): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const list = getLocalCache<ExpenseTransaction[]>(STORAGE_KEYS.EXPENSES, []);
    const filtered = list.filter((e) => e.id !== id);
    setLocalCache(STORAGE_KEYS.EXPENSES, filtered);

    if (navigator.onLine && isSupabaseConfigured()) {
      const userId = await this.getAuthenticatedUserId();
      if (!userId) {
        this.enqueuePending({ id, table: 'expenses', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) {
          this.enqueuePending({ id, table: 'expenses', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        this.enqueuePending({ id, table: 'expenses', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id, table: 'expenses', action: 'DELETE', payload: null });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
  }

  public clearCache(): void {
    this.unsubscribeRealtime();
    localStorage.removeItem(STORAGE_KEYS.HABITS);
    localStorage.removeItem(STORAGE_KEYS.COMPLETIONS);
    localStorage.removeItem(STORAGE_KEYS.CHALLENGE);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  }
}

export const habitService = new HabitService();
