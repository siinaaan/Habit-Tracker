import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardTitle } from '../ui/Card';
import { AnalyticsService } from '../../services/analytics';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, Filter } from 'lucide-react';
import { clsx } from 'clsx';

type TimeframeFilter = 'daily' | 'weekly' | 'monthly' | 'entire';

export const AnalyticsCharts: React.FC = () => {
  const { trackers, logs, habits } = useApp();
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('entire');

  // Build 90-day complete series
  const fullChartData = Array.from({ length: 90 }, (_, idx) => {
    const dayNum = idx + 1;
    const tracker = trackers.find((t) => t.dayNumber === dayNum);
    const completion = tracker ? tracker.completionPercentage : 0;

    // Filter logs for this day
    const trackerLogs = tracker ? logs.filter((l) => l.dailyTrackerId === tracker.id) : [];

    const pomodoroVal = AnalyticsService.calculateTotalMetric('habit-pomodoro', trackerLogs);
    const leetcodeVal = AnalyticsService.calculateTotalMetric('habit-leetcode', trackerLogs);
    const waterVal = AnalyticsService.calculateAverageMetric('habit-water', trackerLogs);
    const meditationVal = AnalyticsService.calculateAverageMetric('habit-meditation', trackerLogs);

    return {
      day: `Day ${dayNum}`,
      dayNum,
      completion,
      overallProgress: Math.round((dayNum / 90) * 100),
      pomodoro: pomodoroVal,
      leetcode: leetcodeVal,
      water: waterVal,
      meditation: meditationVal,
    };
  });

  // Filter dataset based on timeframe selection
  let displayData = fullChartData;
  if (timeframe === 'daily') {
    // Last 14 days
    displayData = fullChartData.slice(0, 14);
  } else if (timeframe === 'weekly') {
    // Aggregate by week (13 weeks)
    displayData = Array.from({ length: 13 }, (_, wIdx) => {
      const weekNum = wIdx + 1;
      const startDay = wIdx * 7 + 1;
      const endDay = Math.min(90, (wIdx + 1) * 7);
      const weekDays = fullChartData.slice(startDay - 1, endDay);
      const avgComp = weekDays.length
        ? Math.round(weekDays.reduce((acc, d) => acc + d.completion, 0) / weekDays.length)
        : 0;

      return {
        day: `Wk ${weekNum}`,
        dayNum: endDay,
        completion: avgComp,
        overallProgress: Math.round((endDay / 90) * 100),
        pomodoro: weekDays.reduce((acc, d) => acc + d.pomodoro, 0),
        leetcode: weekDays.reduce((acc, d) => acc + d.leetcode, 0),
        water: parseFloat(
          (weekDays.reduce((acc, d) => acc + d.water, 0) / (weekDays.length || 1)).toFixed(1)
        ),
        meditation: Math.round(
          weekDays.reduce((acc, d) => acc + d.meditation, 0) / (weekDays.length || 1)
        ),
      };
    });
  } else if (timeframe === 'monthly') {
    // 3 months of 30 days
    displayData = Array.from({ length: 3 }, (_, mIdx) => {
      const startDay = mIdx * 30 + 1;
      const endDay = (mIdx + 1) * 30;
      const monthDays = fullChartData.slice(startDay - 1, endDay);
      const avgComp = monthDays.length
        ? Math.round(monthDays.reduce((acc, d) => acc + d.completion, 0) / monthDays.length)
        : 0;

      return {
        day: `Month ${mIdx + 1}`,
        dayNum: endDay,
        completion: avgComp,
        overallProgress: Math.round((endDay / 90) * 100),
        pomodoro: monthDays.reduce((acc, d) => acc + d.pomodoro, 0),
        leetcode: monthDays.reduce((acc, d) => acc + d.leetcode, 0),
        water: parseFloat(
          (monthDays.reduce((acc, d) => acc + d.water, 0) / (monthDays.length || 1)).toFixed(1)
        ),
        meditation: Math.round(
          monthDays.reduce((acc, d) => acc + d.meditation, 0) / (monthDays.length || 1)
        ),
      };
    });
  }

  // Category Consistency Overview
  const spiritualConsistency = AnalyticsService.calculateCategoryConsistency(
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
  const fitnessConsistency = AnalyticsService.calculateCategoryConsistency(
    'Fitness',
    trackers,
    logs,
    habits
  );
  const healthConsistency = AnalyticsService.calculateCategoryConsistency(
    'Health',
    trackers,
    logs,
    habits
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            📊 Telemetry & Performance Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time automated calculations derived directly from your daily habit logs.
          </p>
        </div>

        {/* Timeframe Filter Buttons */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1">
          <Filter className="w-4 h-4 text-indigo-400 ml-2 mr-1 hidden sm:block" />
          <button
            onClick={() => setTimeframe('daily')}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
              timeframe === 'daily'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Daily (14d)
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
              timeframe === 'weekly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
              timeframe === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeframe('entire')}
            className={clsx(
              'px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer',
              timeframe === 'entire'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Full 90 Days
          </button>
        </div>
      </div>

      {/* Primary Bar Chart: Daily Completion Percentage */}
      <Card>
        <CardTitle>
          <BarChart3 className="w-5 h-5 text-indigo-400" /> Daily Completion Rate (%)
        </CardTitle>
        <div className="h-64 sm:h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="completion" fill="#6366f1" radius={[4, 4, 0, 0]} name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Line Chart: Overall Challenge Trajectory */}
      <Card>
        <CardTitle>
          <TrendingUp className="w-5 h-5 text-emerald-400" /> Overall Challenge Progress Trajectory (Day 1 - 90)
        </CardTitle>
        <div className="h-64 sm:h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Line
                type="monotone"
                dataKey="overallProgress"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                name="Overall Progress %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid of Secondary Metric Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pomodoro Sessions Trend */}
        <Card>
          <CardTitle>🍅 Pomodoro Sessions Sprinted</CardTitle>
          <div className="h-48 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.slice(0, 14)}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                />
                <Bar dataKey="pomodoro" fill="#f97316" radius={[4, 4, 0, 0]} name="Pomodoros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* LeetCode Problems Trend */}
        <Card>
          <CardTitle>🧩 LeetCode Problems Solved</CardTitle>
          <div className="h-48 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData.slice(0, 14)}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px' }}
                />
                <Bar dataKey="leetcode" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Problems" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Category Breakdown Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase">🕌 Spiritual Consistency</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{spiritualConsistency}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase">💻 Learning Consistency</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{learningConsistency}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase">🏃 Fitness Consistency</p>
          <p className="text-2xl font-black text-purple-400 mt-1">{fitnessConsistency}%</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase">💧 Health & Hydration</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{healthConsistency}%</p>
        </div>
      </div>
    </div>
  );
};
