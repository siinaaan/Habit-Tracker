import type {
  DailyTracker,
  HabitLog,
  Habit,
  WeeklySummary,
} from '../types';

export class AnalyticsService {
  /**
   * Calculate current day number (1 - 90) based on challenge start date and target date
   */
  static calculateDayNumber(startDateStr: string, targetDateStr?: string): number {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const target = targetDateStr ? new Date(targetDateStr) : new Date();
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
    
    // Day 1 is the start date
    const dayNum = diffDays + 1;
    return Math.max(1, Math.min(90, dayNum));
  }

  /**
   * Calculate percentage of overall challenge completed (Days elapsed / 90)
   */
  static calculateChallengeOverallProgress(startDateStr: string): number {
    const currentDay = this.calculateDayNumber(startDateStr);
    return Math.round((currentDay / 90) * 100);
  }

  /**
   * Calculate daily completion percentage for a given set of logs and active habits
   */
  static calculateDailyCompletionPercentage(
    logsForDay: HabitLog[],
    activeHabits: Habit[]
  ): number {
    if (!activeHabits.length) return 0;
    const activeHabitIds = new Set(activeHabits.map((h) => h.id));
    const relevantLogs = logsForDay.filter((l) => activeHabitIds.has(l.habitId));

    if (!relevantLogs.length) return 0;

    let completedCount = 0;
    relevantLogs.forEach((l) => {
      if (l.completed) {
        completedCount++;
      }
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
    defaultVal: number = 0
  ): number {
    const habitLogs = logs.filter(
      (l) => l.habitId === habitId && (l.numericValue !== null || l.duration !== null)
    );
    if (!habitLogs.length) return defaultVal;

    let total = 0;
    habitLogs.forEach((l) => {
      total += l.numericValue ?? l.duration ?? 0;
    });

    return parseFloat((total / habitLogs.length).toFixed(1));
  }

  /**
   * Total count metric across tracked days
   */
  static calculateTotalMetric(habitId: string, logs: HabitLog[]): number {
    const habitLogs = logs.filter((l) => l.habitId === habitId);
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
    habits: Habit[]
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

    const waterAverage = this.calculateAverageMetric('habit-water', weekLogs, 2.5);

    const meditationConsistency = this.calculateCategoryConsistency(
      'Health',
      weekTrackers,
      weekLogs,
      habits
    );

    const screenTimeAverage = this.calculateAverageMetric('habit-scroll', weekLogs, 2.5);
    const pomodoroSessionsTotal = this.calculateTotalMetric('habit-pomodoro', weekLogs);
    const leetcodeProblemsTotal = this.calculateTotalMetric('habit-leetcode', weekLogs);

    const sleepLogs = weekLogs.filter((l) => l.habitId === 'habit-sleep' && l.completed);
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
