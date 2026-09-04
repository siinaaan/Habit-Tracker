import { supabase, isSupabaseConfigured } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Debt, DebtRepayment } from '../types';
import { StorageService, getDebtStatus } from './storage';

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

interface PendingDebtSyncItem {
  id: string;
  table: 'debts' | 'debt_repayments';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  userId?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  DEBTS: 'life_upgrade_debts_cache',
  PENDING_SYNC: 'life_upgrade_debts_pending_sync_queue',
};

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
    console.error(`Error writing ${key} to local cache:`, err);
  }
}

class DebtService {
  private syncState: SyncState = 'synced';
  private syncListeners: ((state: SyncState) => void)[] = [];
  private isSyncing = false;
  private realtimeChannel: RealtimeChannel | null = null;
  private onRemoteChangeCallback: (() => void) | null = null;
  private remoteChangeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  public setRemoteChangeCallback(cb: (() => void) | null) {
    this.onRemoteChangeCallback = cb;
  }

  private triggerRemoteChangeCallback() {
    if (this.remoteChangeDebounceTimer) {
      clearTimeout(this.remoteChangeDebounceTimer);
    }
    this.remoteChangeDebounceTimer = setTimeout(() => {
      if (this.onRemoteChangeCallback) {
        this.onRemoteChangeCallback();
      }
    }, 300);
  }

  public initRealtimeSubscriptions(userId: string): void {
    if (!isSupabaseConfigured() || !userId) return;

    try {
      if (this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      this.realtimeChannel = supabase
        .channel(`public:debts_and_repayments:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'debts' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'debt_repayments' },
          () => {
            this.triggerRemoteChangeCallback();
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Supabase Realtime connected for Debts [user: ${userId}]`);
          } else if (err) {
            console.warn(`Supabase Realtime debts subscription status [${status}]:`, err);
          }
        });
    } catch (err) {
      console.warn('Error setting up Supabase Realtime subscriptions for debts:', err);
    }
  }

  public unsubscribeRealtime(): void {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  public getCacheKey(baseKey: string, userId?: string | null): string {
    return userId ? `${baseKey}_${userId}` : baseKey;
  }

  private getPendingQueue(userId?: string | null): PendingDebtSyncItem[] {
    const key = this.getCacheKey(STORAGE_KEYS.PENDING_SYNC, userId);
    return getLocalCache<PendingDebtSyncItem[]>(key, []);
  }

  private enqueuePending(item: Omit<PendingDebtSyncItem, 'timestamp'>): void {
    const queue = this.getPendingQueue(item.userId);
    const filtered = queue.filter(
      (q) => !(q.id === item.id && q.table === item.table && q.action === item.action)
    );
    filtered.push({ ...item, timestamp: Date.now() });
    const key = this.getCacheKey(STORAGE_KEYS.PENDING_SYNC, item.userId);
    setLocalCache(key, filtered);
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

    const queue = this.getPendingQueue(currentUserId);
    if (queue.length === 0) {
      this.setSyncState('synced');
      return;
    }

    this.isSyncing = true;
    this.setSyncState('syncing');

    const remainingQueue: PendingDebtSyncItem[] = [];

    for (const item of queue) {
      if (item.userId && item.userId !== currentUserId) {
        continue;
      }
      if (item.payload && typeof item.payload === 'object') {
        item.payload.user_id = currentUserId;
        if (item.table === 'debt_repayments') {
          delete item.payload.updated_at;
        }
      }

      try {
        if (item.action === 'INSERT') {
          const { error } = await supabase.from(item.table).insert(item.payload);
          if (error && error.code !== '23505') throw error;
        } else if (item.action === 'UPDATE') {
          const { error } = await supabase
            .from(item.table)
            .update(item.payload)
            .eq('id', item.id);
          if (error) throw error;
        } else if (item.action === 'DELETE') {
          const { error } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.id);
          if (error) throw error;
        }
      } catch (err: any) {
        console.warn(`Sync failed for debt ${item.table} (${item.id}):`, err?.message || err);
        remainingQueue.push(item);
      }
    }

    const key = this.getCacheKey(STORAGE_KEYS.PENDING_SYNC, currentUserId);
    setLocalCache(key, remainingQueue);
    this.isSyncing = false;
    this.setSyncState(remainingQueue.length > 0 ? 'error' : 'synced');
  }

  // --- DB Mapping Helpers ---
  private mapDbToDebt(row: any, repayments: DebtRepayment[] = []): Debt {
    const debtObj: Debt = {
      id: row.id,
      userId: row.user_id || row.userId || undefined,
      type: row.type === 'to_give' ? 'to_give' : 'to_get',
      personName: row.person_name || row.personName || 'Unnamed Person',
      amount: Number(row.amount ?? 0),
      description: row.description || '',
      date: row.date || new Date().toISOString().split('T')[0],
      dueDate: row.due_date || row.dueDate || undefined,
      notes: row.notes || '',
      status: 'pending',
      repayments,
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.updated_at || row.updatedDate || new Date().toISOString(),
    };
    debtObj.status = getDebtStatus(debtObj);
    return debtObj;
  }

  private mapDebtToDb(d: Debt, userId?: string): any {
    const payload: any = {
      id: d.id,
      type: d.type,
      person_name: d.personName,
      amount: d.amount,
      description: d.description || null,
      date: d.date,
      due_date: d.dueDate || null,
      notes: d.notes || null,
      status: getDebtStatus(d),
      created_at: d.createdDate,
      updated_at: d.updatedDate,
    };
    if (userId) payload.user_id = userId;
    return payload;
  }

  private mapDbToRepayment(row: any): DebtRepayment {
    return {
      id: row.id,
      debtId: row.debt_id || row.debtId,
      userId: row.user_id || row.userId || undefined,
      amount: Number(row.amount ?? 0),
      date: row.date || new Date().toISOString().split('T')[0],
      note: row.note || '',
      createdDate: row.created_at || row.createdDate || new Date().toISOString(),
      updatedDate: row.created_at || row.updatedDate || new Date().toISOString(),
    };
  }

  private mapRepaymentToDb(r: DebtRepayment, userId?: string): any {
    const payload: any = {
      id: r.id,
      debt_id: r.debtId,
      amount: r.amount,
      date: r.date,
      note: r.note || null,
      created_at: r.createdDate,
    };
    if (userId) payload.user_id = userId;
    return payload;
  }

  // --- CRUD Operations ---
  public async getDebts(userIdOverride?: string | null): Promise<Debt[]> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();
    const localDebts = StorageService.getDebts(userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      try {
        const { data: debtsData, error: debtsErr } = await supabase
          .from('debts')
          .select('*')
          .order('date', { ascending: false });

        if (!debtsErr && debtsData) {
          const { data: repaymentsData } = await supabase
            .from('debt_repayments')
            .select('*')
            .order('date', { ascending: true });

          const allRepayments = (repaymentsData || []).map(this.mapDbToRepayment);
          const repaymentsByDebtId = new Map<string, DebtRepayment[]>();
          allRepayments.forEach((r) => {
            const list = repaymentsByDebtId.get(r.debtId) || [];
            list.push(r);
            repaymentsByDebtId.set(r.debtId, list);
          });

          const remoteDebts = debtsData.map((row: any) => {
            const remoteReps = repaymentsByDebtId.get(row.id) || [];
            const localDebt = localDebts.find((ld) => ld.id === row.id);
            const localReps = localDebt?.repayments || [];

            // Merge repayments so local offline or recently added repayments are never lost
            const repMap = new Map<string, DebtRepayment>();
            remoteReps.forEach((r) => repMap.set(r.id, r));
            localReps.forEach((r) => {
              if (!repMap.has(r.id)) {
                repMap.set(r.id, r);
              }
            });
            const mergedReps = Array.from(repMap.values()).sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            return this.mapDbToDebt(row, mergedReps);
          });

          // Also preserve any local debts that haven't synced to remote yet
          const remoteDebtIds = new Set(remoteDebts.map((d) => d.id));
          const unsyncedLocalDebts = localDebts.filter((ld) => !remoteDebtIds.has(ld.id));
          const finalDebts = [...remoteDebts, ...unsyncedLocalDebts];

          // Update local cache
          const key = this.getCacheKey(STORAGE_KEYS.DEBTS, userId);
          setLocalCache(key, finalDebts);
          this.setSyncState('synced');
          return finalDebts;
        } else if (debtsErr && debtsErr.code !== '42P01') {
          console.warn('Supabase fetch debts warning:', debtsErr.message);
        }
      } catch (err) {
        console.warn('Supabase fetch debts failed, using local cache:', err);
        this.setSyncState('error');
      }
    }

    return localDebts;
  }

  public async createDebt(debt: Debt, userIdOverride?: string | null): Promise<{ debt: Debt; synced: boolean; error?: string }> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();
    const saved = StorageService.saveDebt(debt, userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      if (!userId) {
        const payload = this.mapDebtToDb(saved);
        this.enqueuePending({ id: saved.id, table: 'debts', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { debt: saved, synced: false, error: 'No active session' };
      }

      const payload = this.mapDebtToDb(saved, userId);
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('debts').insert(payload).select().single();
        if (error) {
          console.error('[Debt] Supabase createDebt failed:', {
            debtId: saved.id,
            userId,
            code: error.code,
            message: error.message,
          });
          this.enqueuePending({ id: saved.id, table: 'debts', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { debt: saved, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { debt: saved, synced: true };
        }
      } catch (err: any) {
        console.error('[Debt] Network error during createDebt:', err);
        this.enqueuePending({ id: saved.id, table: 'debts', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { debt: saved, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapDebtToDb(saved, userId || undefined);
      this.enqueuePending({ id: saved.id, table: 'debts', action: 'INSERT', payload, userId: userId || undefined });
      this.setSyncState('offline');
      return { debt: saved, synced: false };
    }
  }

  public async updateDebt(
    id: string,
    updates: Partial<Debt>,
    userIdOverride?: string | null
  ): Promise<{ debt: Debt | null; synced: boolean; error?: string }> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();
    const currentDebts = StorageService.getDebts(userId);
    const existing = currentDebts.find((d) => d.id === id);
    if (!existing) return { debt: null, synced: false, error: 'Debt not found' };

    const updatedDebt: Debt = {
      ...existing,
      ...updates,
      repayments: Array.isArray(updates.repayments) ? updates.repayments : existing.repayments,
      status: getDebtStatus({
        ...existing,
        ...updates,
        repayments: Array.isArray(updates.repayments) ? updates.repayments : existing.repayments,
      }),
      updatedDate: new Date().toISOString(),
    };

    const saved = StorageService.saveDebt(updatedDebt, userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      if (!userId) {
        const payload = this.mapDebtToDb(saved);
        this.enqueuePending({ id, table: 'debts', action: 'UPDATE', payload });
        this.setSyncState('offline');
        return { debt: saved, synced: false, error: 'No active session' };
      }

      const payload = this.mapDebtToDb(saved, userId);
      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('debts').upsert(payload).select().single();
        if (error) {
          console.error('[Debt] Supabase updateDebt failed:', {
            debtId: id,
            userId,
            code: error.code,
            message: error.message,
          });
          this.enqueuePending({ id, table: 'debts', action: 'UPDATE', payload, userId });
          this.setSyncState('error');
          return { debt: saved, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { debt: saved, synced: true };
        }
      } catch (err: any) {
        console.error('[Debt] Network error during updateDebt:', err);
        this.enqueuePending({ id, table: 'debts', action: 'UPDATE', payload, userId });
        this.setSyncState('error');
        return { debt: saved, synced: false, error: err.message || 'Network error' };
      }
    } else {
      const payload = this.mapDebtToDb(saved, userId || undefined);
      this.enqueuePending({ id, table: 'debts', action: 'UPDATE', payload, userId: userId || undefined });
      this.setSyncState('offline');
      return { debt: saved, synced: false };
    }
  }

  public async deleteDebt(id: string, userIdOverride?: string | null): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();
    StorageService.deleteDebt(id, userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      if (!userId) {
        this.enqueuePending({ id, table: 'debts', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('debts').delete().eq('id', id);
        if (error) {
          console.error('[Debt] Supabase deleteDebt failed:', { id, code: error.code, message: error.message });
          this.enqueuePending({ id, table: 'debts', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        console.error('[Debt] Network error during deleteDebt:', err);
        this.enqueuePending({ id, table: 'debts', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id, table: 'debts', action: 'DELETE', payload: null, userId: userId || undefined });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
  }

  public async addRepayment(
    debtId: string,
    repaymentData: { amount: number; date: string; note?: string },
    userIdOverride?: string | null
  ): Promise<{ repayment: DebtRepayment; debt: Debt | null; synced: boolean; error?: string }> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();

    const repayment: DebtRepayment = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      debtId,
      userId: userId || undefined,
      amount: Number(repaymentData.amount),
      date: repaymentData.date,
      note: repaymentData.note || '',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    const updatedDebt = StorageService.addDebtRepayment(debtId, repayment, userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      if (!userId) {
        console.warn('[Debt Repayment] No active session, enqueuing offline.');
        const payload = this.mapRepaymentToDb(repayment);
        this.enqueuePending({ id: repayment.id, table: 'debt_repayments', action: 'INSERT', payload });
        this.setSyncState('offline');
        return { repayment, debt: updatedDebt, synced: false, error: 'No active session' };
      }

      const payload = this.mapRepaymentToDb(repayment, userId);
      try {
        this.setSyncState('syncing');
        console.log('[Debt Repayment] Attempting Supabase insert:', {
          debtId,
          repaymentId: repayment.id,
          userId,
          amount: repayment.amount,
          date: repayment.date,
        });

        const { data: insertData, error: repErr } = await supabase
          .from('debt_repayments')
          .insert(payload)
          .select()
          .single();

        if (repErr) {
          console.error('[Debt Repayment] Supabase insert failed:', {
            debtId,
            repaymentId: repayment.id,
            userId,
            amount: repayment.amount,
            code: repErr.code,
            message: repErr.message,
            details: repErr.details,
            hint: repErr.hint,
          });
          this.enqueuePending({ id: repayment.id, table: 'debt_repayments', action: 'INSERT', payload, userId });
          this.setSyncState('error');
          return { repayment, debt: updatedDebt, synced: false, error: repErr.message };
        }

        console.log('[Debt Repayment] Supabase insert succeeded:', {
          debtId,
          repaymentId: repayment.id,
          inserted: insertData,
        });

        // Also update status and updated_at on parent debt in Supabase
        if (updatedDebt) {
          const { error: debtUpdateErr } = await supabase
            .from('debts')
            .update({ status: updatedDebt.status, updated_at: updatedDebt.updatedDate })
            .eq('id', debtId);

          if (debtUpdateErr) {
            console.warn('[Debt Repayment] Warning: Failed to update debt status in Supabase:', debtUpdateErr.message);
          }
        }

        this.setSyncState('synced');
        return { repayment, debt: updatedDebt, synced: true };
      } catch (err: any) {
        console.error('[Debt Repayment] Network/Unhandled error during Supabase insert:', {
          debtId,
          repaymentId: repayment.id,
          userId,
          amount: repayment.amount,
          error: err?.message || err,
        });
        this.enqueuePending({ id: repayment.id, table: 'debt_repayments', action: 'INSERT', payload, userId });
        this.setSyncState('error');
        return { repayment, debt: updatedDebt, synced: false, error: err.message || 'Network error' };
      }
    } else {
      console.log('[Debt Repayment] Device offline, saved locally only.');
      const payload = this.mapRepaymentToDb(repayment, userId || undefined);
      this.enqueuePending({ id: repayment.id, table: 'debt_repayments', action: 'INSERT', payload, userId: userId || undefined });
      this.setSyncState('offline');
      return { repayment, debt: updatedDebt, synced: false };
    }
  }

  public async deleteRepayment(
    debtId: string,
    repaymentId: string,
    userIdOverride?: string | null
  ): Promise<{ success: boolean; synced: boolean; error?: string }> {
    const userId = userIdOverride !== undefined ? userIdOverride : await this.getAuthenticatedUserId();
    const updatedDebt = StorageService.deleteDebtRepayment(debtId, repaymentId, userId);

    if (navigator.onLine && isSupabaseConfigured()) {
      if (!userId) {
        this.enqueuePending({ id: repaymentId, table: 'debt_repayments', action: 'DELETE', payload: null });
        this.setSyncState('offline');
        return { success: true, synced: false, error: 'No active session' };
      }

      try {
        this.setSyncState('syncing');
        const { error } = await supabase.from('debt_repayments').delete().eq('id', repaymentId);

        if (updatedDebt) {
          await supabase.from('debts').update({ status: updatedDebt.status, updated_at: updatedDebt.updatedDate }).eq('id', debtId);
        }

        if (error) {
          console.error('[Debt Repayment] Delete failed in Supabase:', error);
          this.enqueuePending({ id: repaymentId, table: 'debt_repayments', action: 'DELETE', payload: null, userId });
          this.setSyncState('error');
          return { success: true, synced: false, error: error.message };
        } else {
          this.setSyncState('synced');
          return { success: true, synced: true };
        }
      } catch (err: any) {
        console.error('[Debt Repayment] Delete network error:', err);
        this.enqueuePending({ id: repaymentId, table: 'debt_repayments', action: 'DELETE', payload: null, userId });
        this.setSyncState('error');
        return { success: true, synced: false, error: err.message || 'Network error' };
      }
    } else {
      this.enqueuePending({ id: repaymentId, table: 'debt_repayments', action: 'DELETE', payload: null, userId: userId || undefined });
      this.setSyncState('offline');
      return { success: true, synced: false };
    }
  }
}

export const debtService = new DebtService();
