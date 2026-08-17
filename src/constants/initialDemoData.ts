import type {
  Challenge,
  DailyTracker,
  HabitLog,
  Goal,
  Reflection,
  LearningItem,
  AppSettings,
} from '../types';
import { DEFAULT_HABITS } from './defaultHabits';

// Calculate dates relative to today
const today = new Date();
const formatDateStr = (d: Date) => d.toISOString().split('T')[0];

const getDateOffset = (offsetDays: number): string => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return formatDateStr(d);
};

// Default Challenge starting 7 days ago
export const DEMO_CHALLENGE: Challenge = {
  id: 'challenge-demo-90',
  name: '90-Day High Performance Upgrade',
  startDate: getDateOffset(-7), // Started 7 days ago
  endDate: getDateOffset(83),   // Ends in 83 days (90 total)
  description: 'Transforming discipline, spiritual alignment, coding mastery, and physical health in 90 structured days.',
  status: 'Active',
  createdDate: getDateOffset(-7),
  updatedDate: getDateOffset(0),
};

export const DEMO_SETTINGS: AppSettings = {
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
  isDemoMode: true,
};

// Seed 7 days of daily records and habit logs
export const generateDemoDailyData = (): {
  trackers: DailyTracker[];
  logs: HabitLog[];
} => {
  const trackers: DailyTracker[] = [];
  const logs: HabitLog[] = [];

  // Sample completion profiles for 7 days
  const dayStats = [
    { day: 1, percent: 93, notes: 'Day 1 started strong! High energy and full focus.' },
    { day: 2, percent: 87, notes: 'Crushed morning LeetCode. Smashed 4 pomodoros.' },
    { day: 3, percent: 100, notes: 'Perfect score day! All 5 prayers and full workout completed.' },
    { day: 4, percent: 80, notes: 'Slight fatigue in afternoon, but pushed through evening study.' },
    { day: 5, percent: 93, notes: 'Excellent flow state during coding session. Hydration goal met.' },
    { day: 6, percent: 87, notes: 'Weekend groove! Great workout and deep meditation session.' },
    { day: 7, percent: 93, notes: 'Completed full week evaluation! Progress feeling undeniable.' },
  ];

  dayStats.forEach((stat, idx) => {
    const offset = idx - 7; // Day 1 was 7 days ago, Day 7 is today
    const dateStr = getDateOffset(offset);
    const trackerId = `tracker-demo-day-${stat.day}`;

    trackers.push({
      id: trackerId,
      challengeId: DEMO_CHALLENGE.id,
      dayNumber: stat.day,
      date: dateStr,
      completionPercentage: stat.percent,
      notes: stat.notes,
      createdDate: dateStr,
      updatedDate: dateStr,
    });

    // Create logs for each habit
    DEFAULT_HABITS.forEach((habit) => {
      let completed = true;
      let numericValue: number | null = null;
      let duration: number | null = null;
      let timeValue: string | null = null;

      // Realistic variation
      if (habit.id === 'habit-fajr') completed = true;
      else if (habit.id === 'habit-dhuhr') completed = true;
      else if (habit.id === 'habit-asr') completed = true;
      else if (habit.id === 'habit-maghrib') completed = true;
      else if (habit.id === 'habit-isha') completed = true;
      else if (habit.id === 'habit-leetcode') {
        numericValue = idx % 2 === 0 ? 2 : 3;
        completed = numericValue >= habit.target;
      } else if (habit.id === 'habit-coding') {
        duration = (180 + (idx % 3) * 15) * 60;
        completed = duration >= habit.target * 60;
      } else if (habit.id === 'habit-pomodoro') {
        numericValue = 4 + (idx % 2);
        completed = numericValue >= habit.target;
      } else if (habit.id === 'habit-discipline') {
        completed = idx !== 3; // missed day 4
      } else if (habit.id === 'habit-workout') {
        duration = 45 * 60;
        completed = true;
      } else if (habit.id === 'habit-water') {
        numericValue = 2.8;
        completed = true;
      } else if (habit.id === 'habit-meditation') {
        duration = 15 * 60;
        completed = true;
      } else if (habit.id === 'habit-scroll') {
        completed = true;
      } else if (habit.id === 'habit-snack') {
        completed = true;
      } else if (habit.id === 'habit-sleep') {
        timeValue = '23:30';
        completed = true;
      }

      logs.push({
        id: `log-demo-${stat.day}-${habit.id}`,
        habitId: habit.id,
        dailyTrackerId: trackerId,
        completed,
        numericValue,
        duration,
        timeValue,
        notes: '',
        createdDate: dateStr,
        updatedDate: dateStr,
      });
    });
  });

  return { trackers, logs };
};

export const DEMO_GOALS: Goal[] = [
  {
    id: 'goal-1',
    title: 'Solve 150 Hard/Medium LeetCode Problems',
    description: 'Master Data Structures & Algorithms patterns in Python & TypeScript.',
    category: 'Learning',
    target: 150,
    currentValue: 18,
    unit: 'problems',
    startDate: getDateOffset(-7),
    endDate: getDateOffset(83),
    status: 'In Progress',
    progress: 12,
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(0),
  },
  {
    id: 'goal-2',
    title: 'Complete 250 Pomodoro Deep Work Hours',
    description: 'Clock uninterrupted focus sessions during peak morning hours.',
    category: 'Learning',
    target: 250,
    currentValue: 32,
    unit: 'hours',
    startDate: getDateOffset(-7),
    endDate: getDateOffset(83),
    status: 'In Progress',
    progress: 13,
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(0),
  },
  {
    id: 'goal-3',
    title: '100% On-Time Fajr & Daily Prayers',
    description: 'Build spiritual discipline and consistency without missing congregational/on-time prayers.',
    category: 'Spiritual',
    target: 450,
    currentValue: 35,
    unit: 'prayers',
    startDate: getDateOffset(-7),
    endDate: getDateOffset(83),
    status: 'In Progress',
    progress: 8,
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(0),
  },
];

export const DEMO_REFLECTIONS: Reflection[] = [
  {
    id: 'reflection-1',
    date: getDateOffset(-6),
    challengeDay: 1,
    accomplished: 'Set up 90-day tracking matrix, solved 2 array sliding window problems, drank 3L water.',
    learned: 'Waking up 30 minutes earlier creates immediate momentum for LeetCode.',
    wentWell: 'Morning routine went smoothly without phone checking.',
    shouldImprove: 'Prepare workout clothes the night before to save decision time.',
    mood: '🔥 Unstoppable',
    createdDate: getDateOffset(-6),
    updatedDate: getDateOffset(-6),
  },
  {
    id: 'reflection-2',
    date: getDateOffset(-4),
    challengeDay: 3,
    accomplished: 'Hit 100% completion across all 15 habits. Finished 4 Pomodoro sessions.',
    learned: 'Breaking large coding tasks into 50-minute chunks prevents mental burnout.',
    wentWell: 'Hydration and prayer timing were spot on.',
    shouldImprove: 'Cut off caffeine after 2:00 PM for deeper sleep.',
    mood: '😊 Satisfied',
    createdDate: getDateOffset(-4),
    updatedDate: getDateOffset(-4),
  },
  {
    id: 'reflection-3',
    date: getDateOffset(0),
    challengeDay: 7,
    accomplished: 'Completed week 1 review! Cleaned up code repo and finished system architecture.',
    learned: 'Consistency scales exponentially when momentum is preserved.',
    wentWell: 'Screen time reduced by 40% compared to pre-challenge average.',
    shouldImprove: 'Maintain hydration pace throughout the afternoon.',
    mood: '⚡ Energetic',
    createdDate: getDateOffset(0),
    updatedDate: getDateOffset(0),
  },
];

export const DEMO_LEARNING: LearningItem[] = [
  {
    id: 'learning-1',
    topic: 'Advanced Distributed Systems & Microservices Architecture',
    description: 'Studying event-driven patterns, Kafka message streaming, and distributed consensus algorithms.',
    category: 'Backend Architecture',
    status: 'In Progress',
    progressPercentage: 35,
    startDate: getDateOffset(-7),
    targetDate: getDateOffset(30),
    notes: 'Covered Raft consensus and WAL durability. Next: Partitioning and Sharding.',
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(0),
  },
  {
    id: 'learning-2',
    topic: 'System Design & Scalable Data Structures',
    description: 'Graph algorithms, Segment Trees, Bloom Filters, and LRU Cache implementations.',
    category: 'Algorithms',
    status: 'In Progress',
    progressPercentage: 45,
    startDate: getDateOffset(-7),
    targetDate: getDateOffset(45),
    notes: 'Practiced Top K Frequent Elements & Dijkstra shortest path.',
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(0),
  },
  {
    id: 'learning-3',
    topic: 'TypeScript Advanced Type System & Compiler Internal Mechanics',
    description: 'Template literal types, infer keyword, conditional types, and custom AST transformers.',
    category: 'Language Deep Dive',
    status: 'Completed',
    progressPercentage: 100,
    startDate: getDateOffset(-7),
    targetDate: getDateOffset(-1),
    notes: 'Completed full hands-on exercise building custom utility types.',
    createdDate: getDateOffset(-7),
    updatedDate: getDateOffset(-1),
  },
];
