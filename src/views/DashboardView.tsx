import React from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/ui/StatCard';
import { ProgressRing } from '../components/ui/ProgressRing';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Card, CardTitle } from '../components/ui/Card';
import { HabitCard } from '../components/habits/HabitCard';
import { TaskList } from '../components/tasks/TaskList';
import { AnalyticsService } from '../services/analytics';
import { Button } from '../components/ui/Button';
import {
  Flame,
  TrendingUp,
  BookOpen,
  Droplets,
  Timer,
  Puzzle,
  Smartphone,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    activeChallenge,
    currentDayNumber,
    trackers,
    logs,
    habits,
    tasks,
    selectedDayTracker,
    selectedDayLogs,
    updateHabitLog,
    setActiveTab,
    selectedDate,
    setIsAddTaskModalOpen,
  } = useApp();

  const activeHabits = habits.filter((h) => h.active);

  // Calculated overall metrics
  const overallProgress = activeChallenge
    ? AnalyticsService.calculateChallengeOverallProgress(activeChallenge.startDate)
    : 0;

  const prayerConsistency = AnalyticsService.calculateCategoryConsistency(
    'Spiritual',
    trackers,
    logs,
    habits
  );

  const learningConsistency = AnalyticsService.calculateCategoryConsistency(
    'Learning',
    trackers,
    logs,
    habits
  );

  const averageWater = AnalyticsService.calculateAverageMetric('habit-water', logs, 2.5);
  const totalPomodoros = AnalyticsService.calculateTotalMetric('habit-pomodoro', logs);
  const totalLeetcode = AnalyticsService.calculateTotalMetric('habit-leetcode', logs);
  const averageScreenTime = AnalyticsService.calculateAverageMetric('habit-scroll', logs, 2.8);

  // Real Task statistics calculated directly from stored task data
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const dueTodayTasksCount = tasks.filter((t) => t.dueDate === selectedDate).length;
  const taskCompletionPercent = totalTasksCount
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  // Today's completion stats
  const todayCompletion = selectedDayTracker ? selectedDayTracker.completionPercentage : 0;
  
  const completedLogsCount = selectedDayLogs.filter((l) => l.completed).length;
  const remainingHabits = activeHabits.filter((h) => {
    const log = selectedDayLogs.find((l) => l.habitId === h.id);
    return !log?.completed;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Challenge Overview */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 animate-pulse" /> Active Challenge
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              {activeChallenge?.name || '90-Day High Performance Upgrade'}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              {activeChallenge?.description || 'Transforming discipline, prayer, coding mastery, and health.'}
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-300 pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" /> Start: {activeChallenge?.startDate}
              </span>
              <span>•</span>
              <span className="text-emerald-400">Target: 90 Days</span>
            </div>
          </div>

          {/* Big Day Counter Badge */}
          <div className="flex items-center gap-6 shrink-0 bg-slate-950/60 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl">
            <ProgressRing
              progress={overallProgress}
              size={110}
              strokeWidth={10}
              label={`Day ${currentDayNumber}`}
              sublabel="Overall"
            />
          </div>
        </div>
      </div>

      {/* KPI Dashboard Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Day"
          value={`Day ${currentDayNumber} / 90`}
          subtitle={`${90 - currentDayNumber} days remaining`}
          icon={<Flame className="w-5 h-5" />}
          iconBgColor="bg-orange-500/10 text-orange-400 border-orange-500/20"
        />

        <StatCard
          title="Overall Progress"
          value={`${overallProgress}%`}
          subtitle="90-day completion rate"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
        />

        <StatCard
          title="Prayer Consistency"
          value={`${prayerConsistency}%`}
          subtitle="5 daily prayers logged"
          icon="🕌"
          iconBgColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        />

        <StatCard
          title="Learning Consistency"
          value={`${learningConsistency}%`}
          subtitle="Coding & LeetCode focus"
          icon={<BookOpen className="w-5 h-5" />}
          iconBgColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
        />

        <StatCard
          title="Average Water"
          value={`${averageWater} L`}
          subtitle="Target 2.5L daily"
          icon={<Droplets className="w-5 h-5" />}
          iconBgColor="bg-sky-500/10 text-sky-400 border-sky-500/20"
        />

        <StatCard
          title="Pomodoro Sessions"
          value={totalPomodoros}
          subtitle="50m focus sprints"
          icon={<Timer className="w-5 h-5" />}
          iconBgColor="bg-orange-500/10 text-orange-400 border-orange-500/20"
        />

        <StatCard
          title="LeetCode Problems"
          value={totalLeetcode}
          subtitle="Solved before cut-off"
          icon={<Puzzle className="w-5 h-5" />}
          iconBgColor="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
        />

        <StatCard
          title="Average Screen Time"
          value={`${averageScreenTime} hrs`}
          subtitle="Digital wellbeing"
          icon={<Smartphone className="w-5 h-5" />}
          iconBgColor="bg-slate-500/10 text-slate-300 border-slate-500/20"
        />
      </div>

      {/* Today's Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Completion Summary */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <CardTitle>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Today's Check-In Status
            </CardTitle>

            <div className="flex flex-col items-center justify-center my-6">
              <ProgressRing
                progress={todayCompletion}
                size={160}
                strokeWidth={14}
                label={`${completedLogsCount} / ${activeHabits.length}`}
                sublabel="Habits Completed"
              />
            </div>

            <ProgressBar progress={todayCompletion} showLabel color="gradient" height="lg" />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Button
              className="w-full"
              variant="primary"
              onClick={() => setActiveTab('daily')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Open Daily Tracker ({selectedDate})
            </Button>
          </div>
        </Card>

        {/* Remaining Habits Quick Panel */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              🔥 Remaining Habits for Today ({remainingHabits.length})
            </CardTitle>
            <span className="text-xs text-slate-400 font-medium">Auto-saves on check-in</span>
          </div>

          {remainingHabits.length === 0 ? (
            <div className="p-8 text-center bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
              <span className="text-3xl">🎉</span>
              <h4 className="text-lg font-black text-emerald-300">All Today's Habits Completed!</h4>
              <p className="text-xs text-slate-400">Great job maintaining 100% daily discipline.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {remainingHabits.map((habit) => {
                const log = selectedDayLogs.find((l) => l.habitId === habit.id);
                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    log={log}
                    onUpdateLog={updateHabitLog}
                  />
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Real Task Telemetry & Task List Section */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>
            <CheckSquare className="w-5 h-5 text-indigo-400" /> Actionable Tasks & To-Dos
          </CardTitle>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsAddTaskModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            + Add Task
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tasks</p>
            <p className="text-xl font-black text-white mt-0.5">{totalTasksCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Completed</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{completedTasksCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Due Today</p>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{dueTodayTasksCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Task Completion</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{taskCompletionPercent}%</p>
          </div>
        </div>

        <TaskList />
      </Card>
    </div>
  );
};
