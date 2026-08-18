import type { Habit } from '../types';

/**
 * Strictly checks if a habitId matches a base DEFAULT_HABIT ID (e.g. 'habit-fajr').
 * Matches if targetId === baseId OR targetId === `${baseId}-${userId}`.
 * Does NOT match unrelated custom habits such as 'habit-fajr-custom'.
 */
export function isMatchingDefaultHabit(
  targetId: string | null | undefined,
  baseId: string,
  userId?: string | null
): boolean {
  if (!targetId || !baseId) return false;
  if (targetId === baseId) return true;
  if (userId && targetId === `${baseId}-${userId}`) return true;

  // Strict check: if targetId starts with baseId + '-', ensure suffix is NOT custom
  if (targetId.startsWith(`${baseId}-`)) {
    const suffix = targetId.slice(baseId.length + 1);
    if (suffix.startsWith('custom') || suffix.includes('custom')) {
      return false;
    }
    return suffix.length >= 6;
  }
  return false;
}

/**
 * Resolves the actual habit ID in a user's habits list given a base habit ID or current habit ID.
 * Returns the exact habit.id if found in userHabits, otherwise returns baseId.
 */
export function resolveHabitId(
  baseId: string,
  userHabits: Habit[],
  userId?: string | null
): string {
  if (!baseId) return baseId;

  // 1. Exact match in userHabits
  const exact = userHabits.find((h) => h.id === baseId);
  if (exact) return exact.id;

  // 2. User-scoped match (e.g. baseId is 'habit-fajr' and user has 'habit-fajr-user123')
  if (userId) {
    const userScoped = userHabits.find((h) => h.id === `${baseId}-${userId}`);
    if (userScoped) return userScoped.id;
  }

  // 3. Match default habit base strictly
  const defaultMatch = userHabits.find((h) => isMatchingDefaultHabit(h.id, baseId, userId));
  if (defaultMatch) return defaultMatch.id;

  return baseId;
}
