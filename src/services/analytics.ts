import type {
  DailyTracker,
  HabitLog,
  Habit,
  WeeklySummary,
  TaskItem,
} from '../types';
import { isMatchingDefaultHabit } from '../utils/habitUtils';

import { parseLocalDateStr, getTodayLocalDateStr } from '../utils/dateUtils';

export class AnalyticsService {
  /**
   * Calculate current day number (1 - 90) based on challenge start date and target date
   */
  static calculateDayNumber(startDateStr: string, targetDateStr?: string): number {
    try {
      const start = parseLocalDateStr(startDateStr);
      const target = targetDateStr ? parseLocalDateStr(targetDateStr) : parseLocalDateStr(getTodayLocalDateStr());

      const diffTime = target.getTime() - start.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      
      // Day 1 is the start date
      const dayNum = diffDays + 1;
      return Math.max(1, Math.min(90, dayNum));
    } catch {
      return 1;
    }
  }

  /**
   * Calculate percentage of overall challenge completed based on actual completed habits and tasks.
   * Returns 0% if there is no activity data or zero completed activities.
   */
  static calculateChallengeOverallProgress(
    trackers: DailyTracker[],
    logs: HabitLog[],
    habits: Habit[],
    tasks: TaskItem[] = []
  ): number {
    const activeHabits = habits.filter((h) => h.active);
    const completedHabitsCount = logs.filter((l) => l.completed).length;
    const completedTasksCount = tasks.filter((t) => t.completed).length;

    const totalCompleted = completedHabitsCount + completedTasksCount;

    const habitOpportunities =
      trackers.length > 0 && activeHabits.length > 0
        ? Math.max(trackers.length * activeHabits.length, logs.length)
        : logs.length;
    const taskOpportunities = tasks.length;

    const totalOpportunities = habitOpportunities + taskOpportunities;

    if (totalOpportunities === 0) return 0;

    return Math.round((totalCompleted / totalOpportunities) * 100);
  }

  /**
   * Calculate daily completion percentage for a given set of logs and active habits
   */
  static calculateDailyCompletionPercentage(
    logsForDay: HabitLog[],
    activeHabits: Habit[],
    userId?: string | null
  ): number {
    if (!activeHabits.length) return 0;
    
    let completedCount = 0;
    activeHabits.forEach((h) => {
      const isDone = logsForDay.some(
        (l) =>
          (l.habitId === h.id || isMatchingDefaultHabit(l.habitId, h.id, userId)) &&
          Boolean(l.completed)
      );
      if (isDone) completedCount++;
    });

    return Math.round((completedCount / activeHabits.length) * 100);
  }

  /**
   * Category consistency metrics (%) over all tracked days
   */
  static calculateCategoryConsistency(
    categoryName: string,
    trackers: DailyTracker[],
    logs: HabitLog[],
    habits: Habit[]
  ): number {
    const categoryHabitIds = habits
      .filter((h) => h.category === categoryName && h.active)
      .map((h) => h.id);

    if (!categoryHabitIds.length || !trackers.length) return 0;

    const categorySet = new Set(categoryHabitIds);
    let totalOpportunities = 0;
    let totalCompleted = 0;

    trackers.forEach((t) => {
      const trackerLogs = logs.filter(
        (l) => l.dailyTrackerId === t.id && categorySet.has(l.habitId)
      );
      categoryHabitIds.forEach((hId) => {
        totalOpportunities++;
        const log = trackerLogs.find((l) => l.habitId === hId);
        if (log && log.completed) {
          totalCompleted++;
        }
      });
    });

    return totalOpportunities > 0
      ? Math.round((totalCompleted / totalOpportunities) * 100)
      : 0;
  }

  /**
   * Average numerical value metric across tracked days
   */
  static calculateAverageMetric(
    habitId: string,
    logs: HabitLog[],
    userId?: string | null
  ): number {
    const habitLogs = logs.filter(
      (l) => isMatchingDefaultHabit(l.habitId, habitId, userId) && (l.numericValue !== null || l.duration !== null)
    );
    if (!habitLogs.length) return 0;

    let total = 0;
    habitLogs.forEach((l) => {
      if (l.numericValue !== null) {
        total += l.numericValue;
      } else if (l.duration !== null) {
        total += l.duration / 60;
      }
    });

    return parseFloat((total / habitLogs.length).toFixed(1));
  }

  /**
   * Total count metric across tracked days
   */
  static calculateTotalMetric(habitId: string, logs: HabitLog[], userId?: string | null): number {
    const habitLogs = logs.filter((l) => isMatchingDefaultHabit(l.habitId, habitId, userId));
    if (!habitLogs.length) return 0;
    let total = 0;
    habitLogs.forEach((l) => {
      total += l.numericValue ?? (l.completed ? 1 : 0);
    });
    return Math.round(total);
  }

  /**
   * Weekly summaries comparison for Week X vs Week (X-1)
   */
  static generateWeeklySummary(
    weekNumber: number,
    trackers: DailyTracker[],
    logs: HabitLog[],
    habits: Habit[],
    userId?: string | null
  ): WeeklySummary {
    const startDay = (weekNumber - 1) * 7 + 1;
    const endDay = weekNumber * 7;

    const weekTrackers = trackers.filter(
      (t) => t.dayNumber >= startDay && t.dayNumber <= endDay
    );

    const weekTrackerIds = new Set(weekTrackers.map((t) => t.id));
    const weekLogs = logs.filter((l) => weekTrackerIds.has(l.dailyTrackerId));

    const avgCompletion = weekTrackers.length
      ? Math.round(
          weekTrackers.reduce((acc, t) => acc + t.completionPercentage, 0) /
            weekTrackers.length
        )
      : 0;

    const prayerConsistency = this.calculateCategoryConsistency(
      'Spiritual',
      weekTrackers,
      weekLogs,
      habits
    );

    const learningConsistency = this.calculateCategoryConsistency(
      'Learning',
      weekTrackers,
      weekLogs,
      habits
    );

    const workoutConsistency = this.calculateCategoryConsistency(
      'Fitness',
      weekTrackers,
      weekLogs,
      habits
    );

    const waterAverage = this.calculateAverageMetric('habit-water', weekLogs, userId);

    const meditationConsistency = this.calculateCategoryConsistency(
      'Health',
      weekTrackers,
      weekLogs,
      habits
    );

    const screenTimeAverage = this.calculateAverageMetric('habit-scroll', weekLogs, userId);
    const pomodoroSessionsTotal = this.calculateTotalMetric('habit-pomodoro', weekLogs, userId);
    const leetcodeProblemsTotal = this.calculateTotalMetric('habit-leetcode', weekLogs, userId);

    const sleepLogs = weekLogs.filter((l) => isMatchingDefaultHabit(l.habitId, 'habit-sleep', userId) && l.completed);
    const sleepConsistency = weekTrackers.length
      ? Math.round((sleepLogs.length / weekTrackers.length) * 100)
      : 0;

    const startDate = weekTrackers[0]?.date || 'Day ' + startDay;
    const endDate = weekTrackers[weekTrackers.length - 1]?.date || 'Day ' + endDay;

    return {
      weekNumber,
      startDate,
      endDate,
      averageCompletion: avgCompletion,
      prayerConsistency,
      learningConsistency,
      workoutConsistency,
      waterAverage,
      meditationConsistency,
      screenTimeAverage,
      pomodoroSessionsTotal,
      leetcodeProblemsTotal,
      sleepConsistency,
    };
  }
}
