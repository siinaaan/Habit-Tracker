import React from 'react';
import { useApp } from '../context/AppContext';
import { HabitCard } from '../components/habits/HabitCard';
import { Card, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Plus } from 'lucide-react';
import type { HabitCategory } from '../types';

export const DailyTrackerView: React.FC = () => {
  const {
    currentDayNumber,
    selectedDate,
    setSelectedDate,
    selectedDayTracker,
    selectedDayLogs,
    habits,
    updateHabitLog,
    setIsAddHabitModalOpen,
  } = useApp();

  const activeHabits = habits.filter((h) => h.active);
  const completionPercent = selectedDayTracker ? selectedDayTracker.completionPercentage : 0;

  const handlePrevDay = () => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() - 1);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + 1);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Group active habits into categories
  const categories: { name: HabitCategory; label: string; icon: string }[] = [
    { name: 'Spiritual', label: 'SPIRITUAL (5 Daily Prayers)', icon: '🕌' },
    { name: 'Learning', label: 'LEARNING & CODING', icon: '💻' },
    { name: 'Fitness', label: 'FITNESS & WORKOUT', icon: '🏃' },
    { name: 'Health', label: 'HEALTH & HYDRATION', icon: '💧' },
    { name: 'Discipline', label: 'DISCIPLINE & MINDSET', icon: '🧠' },
    { name: 'Digital Wellbeing', label: 'DIGITAL WELLBEING', icon: '📱' },
    { name: 'Custom', label: 'CUSTOM HABITS', icon: '⚡' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Top Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <span>TODAY CHECK-IN</span> • <span>DAY {currentDayNumber} / 90</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> {selectedDate}
          </h2>
        </div>

        {/* Date Stepper */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">Daily Check-In Progress</span>
          </div>
          <span className="text-lg font-black text-emerald-400">{completionPercent}%</span>
        </div>
        <ProgressBar progress={completionPercent} color="gradient" height="lg" />
      </Card>

      {/* Habits List Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
          🔥 Daily Habits Check-In
        </h3>
        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsAddHabitModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Habit
        </Button>
      </div>

      {/* Grouped Habit Categories */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const categoryHabits = activeHabits.filter((h) => h.category === cat.name);
          if (!categoryHabits.length) return null;

          return (
            <Card key={cat.name} className="space-y-3">
              <CardTitle className="text-base font-extrabold text-slate-200">
                <span>{cat.icon}</span> {cat.label} ({categoryHabits.length})
              </CardTitle>

              <div className="space-y-2.5">
                {categoryHabits.map((habit) => {
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
            </Card>
          );
        })}
      </div>
    </div>
  );
};
