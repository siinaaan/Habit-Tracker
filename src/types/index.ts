export type ChallengeStatus = 'Not Started' | 'Active' | 'Completed' | 'Paused';

export interface Challenge {
  id: string;
  name: string;
  startDate: string; // ISO format YYYY-MM-DD
  endDate: string;   // ISO format YYYY-MM-DD
  description: string;
  status: ChallengeStatus;
  createdDate: string;
  updatedDate: string;
}

export type HabitCategory =
  | 'Spiritual'
  | 'Learning'
  | 'Health'
  | 'Fitness'
  | 'Discipline'
  | 'Digital Wellbeing'
  | 'Custom';

export type HabitType = 'checkbox' | 'number' | 'duration' | 'time';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  icon: string;
  type: HabitType;
  target: number;      // Target numeric value (e.g. 1 for checkbox, 2.5 for water L, 50 for duration mins)
  unit: string;        // e.g. 'L', 'mins', 'problems', 'sessions', 'hrs', 'HH:MM'
  frequency: 'daily' | 'weekly';
  active: boolean;
  order: number;
  createdDate: string;
  updatedDate: string;
}

export interface DailyTracker {
  id: string;
  challengeId: string;
  dayNumber: number;  // 1 to 90
  date: string;       // ISO YYYY-MM-DD
  completionPercentage: number;
  notes: string;
  createdDate: string;
  updatedDate: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  dailyTrackerId: string;
  completed: boolean;
  numericValue: number | null;
  duration: number | null; // in minutes
  timeValue: string | null; // e.g. "23:45"
  notes: string;
  createdDate: string;
  updatedDate: string;
}

export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Archived';

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  target: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progress: number; // 0 - 100
  createdDate: string;
  updatedDate: string;
}

export type MoodType = '⚡ Energetic' | '😊 Satisfied' | '😐 Neutral' | '😫 Tired' | '🔥 Unstoppable';

export interface Reflection {
  id: string;
  date: string;
  challengeDay: number;
  accomplished: string;
  learned: string;
  wentWell: string;
  shouldImprove: string;
  mood: MoodType;
  createdDate: string;
  updatedDate: string;
}

export type LearningStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Paused';

export interface LearningItem {
  id: string;
  topic: string;
  description: string;
  category: string;
  status: LearningStatus;
  progressPercentage: number;
  startDate: string;
  targetDate: string;
  notes: string;
  createdDate: string;
  updatedDate: string;
}

export interface PomodoroSettings {
  focusDuration: number;       // default 50 mins
  shortBreakDuration: number;  // default 10 mins
  longBreakDuration: number;   // default 20 mins
  longBreakInterval: number;   // default 4 sessions
  workStartTime: string;       // default "09:30"
  workEndTime: string;         // default "16:30"
}

export interface AppSettings {
  theme: 'dark' | 'light';
  waterGoal: number;           // in Litres
  sleepGoalHours: number;      // in Hours
  screenTimeLimitHours: number;// in Hours
  pomodoroSettings: PomodoroSettings;
  isDemoMode: boolean;
}

export interface WeeklySummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  averageCompletion: number;
  prayerConsistency: number;
  learningConsistency: number;
  workoutConsistency: number;
  waterAverage: number;
  meditationConsistency: number;
  screenTimeAverage: number;
  pomodoroSessionsTotal: number;
  leetcodeProblemsTotal: number;
  sleepConsistency: number;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskRepeatType = 'None' | 'Daily' | 'Weekly' | 'Custom';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: TaskPriority;
  dueDate: string;     // ISO format YYYY-MM-DD
  dueTime?: string;    // e.g. "14:30"
  repeatType: TaskRepeatType;
  habitId?: string | null;
  completed: boolean;
  createdDate: string;
  updatedDate: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'daily'
  | 'analytics'
  | 'calendar'
  | 'weekly'
  | 'goals'
  | 'reflections'
  | 'learning'
  | 'milestones'
  | 'pomodoro'
  | 'expenses'
  | 'settings';

export type ExpenseType = 'income' | 'expense';

export type ExpenseCategory =
  | 'Salary'
  | 'Freelance'
  | 'Investments'
  | 'Food & Dining'
  | 'Bills & Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Transportation'
  | 'Health & Medical'
  | 'Education'
  | 'Other';

export interface ExpenseTransaction {
  id: string;
  title: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory | string;
  date: string; // ISO format YYYY-MM-DD
  note?: string;
  createdDate: string;
  updatedDate: string;
}

