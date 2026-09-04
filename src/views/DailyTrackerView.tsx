import React from 'react';
import { useApp } from '../context/AppContext';
import { HabitCard } from '../components/habits/HabitCard';
import { Card, CardTitle } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle2, Plus, Lock } from 'lucide-react';
import type { HabitCategory } from '../types';
import { formatDateToLocalStr, getTodayLocalDateStr, parseLocalDateStr, getRelativeDateLabel } from '../utils/dateUtils';

export const DailyTrackerView: React.FC = () => {
  const {
    currentDayNumber,
    selectedDate,
    setSelectedDate,
    isSelectedDateLocked,
    selectedDayTracker,
    selectedDayLogs,
    habits,
    updateHabitLog,
    setIsAddHabitModalOpen,
  } = useApp();

  const activeHabits = habits.filter((h) => h.active);
  const completedLogsCount = selectedDayLogs.filter((l) => l.completed).length;
  const completionPercent = activeHabits.length
    ? Math.round((completedLogsCount / activeHabits.length) * 100)
    : (selectedDayTracker ? selectedDayTracker.completionPercentage : 0);

  const handlePrevDay = () => {
    const curr = parseLocalDateStr(selectedDate);
    curr.setDate(curr.getDate() - 1);
    setSelectedDate(formatDateToLocalStr(curr));
  };

  const handleToday = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  const handleNextDay = () => {
    const curr = parseLocalDateStr(selectedDate);
    curr.setDate(curr.getDate() + 1);
    setSelectedDate(formatDateToLocalStr(curr));
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
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest flex-wrap">
            <span className="text-indigo-400">DAY CHECK-IN</span> • <span className="text-indigo-400">DAY {currentDayNumber} / 90</span>
            {isSelectedDateLocked && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold ml-1">
                <Lock className="w-3.5 h-3.5" /> View Only — Check-ins can only be recorded for today
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> {getRelativeDateLabel(selectedDate)}
          </h2>
        </div>

        {/* Date Stepper */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30 min-h-[38px] flex items-center justify-center"
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
            title="Next Day"
            aria-label="Next Day"
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

      {/* Grouped Habit Categories or Empty State */}
      {activeHabits.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-indigo-400" />}
          title="No Active Habits Found"
          description="You don't have any active habits configured for daily tracking. Add your first habit to begin building your streak."
          actionText="+ Add Habit"
          onAction={() => setIsAddHabitModalOpen(true)}
        />
      ) : (
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
                        isReadOnly={isSelectedDateLocked}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
