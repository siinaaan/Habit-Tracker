import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AnalyticsService } from '../../services/analytics';
import { Card, CardTitle } from '../ui/Card';
import { TrendingUp, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export const WeeklyReportView: React.FC = () => {
  const { trackers, logs, habits, currentDayNumber } = useApp();

  // Current week calculated based on current day number
  const activeWeekNum = Math.ceil(currentDayNumber / 7);
  const [selectedWeek, setSelectedWeek] = useState<number>(activeWeekNum || 1);

  const currentSummary = AnalyticsService.generateWeeklySummary(
    selectedWeek,
    trackers,
    logs,
    habits
  );

  const prevSummary = AnalyticsService.generateWeeklySummary(
    Math.max(1, selectedWeek - 1),
    trackers,
    logs,
    habits
  );

  const getDiff = (curr: number, prev: number) => {
    const diff = curr - prev;
    return {
      diff,
      text: `${diff >= 0 ? '+' : ''}${diff}%`,
      isUp: diff >= 0,
    };
  };

  const metrics = [
    {
      title: 'Average Daily Completion',
      curr: `${currentSummary.averageCompletion}%`,
      diff: getDiff(currentSummary.averageCompletion, prevSummary.averageCompletion),
      icon: '📈',
    },
    {
      title: 'Prayer Consistency (5 Daily)',
      curr: `${currentSummary.prayerConsistency}%`,
      diff: getDiff(currentSummary.prayerConsistency, prevSummary.prayerConsistency),
      icon: '🕌',
    },
    {
      title: 'Learning & Coding Consistency',
      curr: `${currentSummary.learningConsistency}%`,
      diff: getDiff(currentSummary.learningConsistency, prevSummary.learningConsistency),
      icon: '💻',
    },
    {
      title: 'Workout & Fitness Discipline',
      curr: `${currentSummary.workoutConsistency}%`,
      diff: getDiff(currentSummary.workoutConsistency, prevSummary.workoutConsistency),
      icon: '🏃',
    },
    {
      title: 'Average Water Hydration',
      curr: `${currentSummary.waterAverage} L / day`,
      diff: getDiff(currentSummary.waterAverage * 10, prevSummary.waterAverage * 10),
      icon: '💧',
    },
    {
      title: 'Meditation Consistency',
      curr: `${currentSummary.meditationConsistency}%`,
      diff: getDiff(currentSummary.meditationConsistency, prevSummary.meditationConsistency),
      icon: '🧘',
    },
    {
      title: 'Pomodoro Sprints Solved',
      curr: `${currentSummary.pomodoroSessionsTotal} sessions`,
      diff: getDiff(currentSummary.pomodoroSessionsTotal, prevSummary.pomodoroSessionsTotal),
      icon: '🍅',
    },
    {
      title: 'LeetCode Problems Solved',
      curr: `${currentSummary.leetcodeProblemsTotal} problems`,
      diff: getDiff(currentSummary.leetcodeProblemsTotal, prevSummary.leetcodeProblemsTotal),
      icon: '🧩',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            📈 Automated Weekly Performance Report
          </h2>
          <p className="text-xs text-slate-400">
            Compare week-over-week growth and habit consistency deltas.
          </p>
        </div>

        {/* Week Stepper Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            disabled={selectedWeek <= 1}
            onClick={() => setSelectedWeek((prev) => Math.max(1, prev - 1))}
            aria-label="Previous Week"
            title="Previous Week"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold px-3 text-slate-200">
            Week {selectedWeek} <span className="text-slate-500">/ 13</span>
          </span>

          <button
            disabled={selectedWeek >= 13}
            onClick={() => setSelectedWeek((prev) => Math.min(13, prev + 1))}
            aria-label="Next Week"
            title="Next Week"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week vs Previous Week Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className="relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{m.title}</p>
                <p className="text-2xl font-black text-white mt-1">{m.curr}</p>
              </div>
              <span className="text-2xl p-2 rounded-xl bg-slate-800">{m.icon}</span>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-bold">
              <span
                className={clsx(
                  'flex items-center gap-0.5',
                  m.diff.isUp ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {m.diff.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {m.diff.text}
              </span>
              <span className="text-slate-500 font-normal">vs Week {Math.max(1, selectedWeek - 1)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Executive Summary */}
      <Card>
        <CardTitle>
          <TrendingUp className="w-5 h-5 text-indigo-400" /> Week {selectedWeek} Executive Summary
        </CardTitle>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <p>
            During Week {selectedWeek}, you achieved an average daily completion score of{' '}
            <strong className="text-emerald-400">{currentSummary.averageCompletion}%</strong>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Spiritual prayer consistency stood at {currentSummary.prayerConsistency}%, with learning discipline at {currentSummary.learningConsistency}%. Hydration averaged {currentSummary.waterAverage}L daily with {currentSummary.pomodoroSessionsTotal} total Pomodoro focus sprints.
          </p>
        </div>
      </Card>
    </div>
  );
};
