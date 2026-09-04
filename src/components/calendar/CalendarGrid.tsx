import React from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardTitle } from '../ui/Card';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { formatDateToLocalStr, getTodayLocalDateStr, parseLocalDateStr } from '../../utils/dateUtils';
import { AnalyticsService } from '../../services/analytics';
import { StorageService } from '../../services/storage';

export const CalendarGrid: React.FC = () => {
  const {
    activeChallenge,
    trackers,
    logs,
    habits,
    selectedDate,
    setSelectedDate,
    setActiveTab,
    currentDayNumber,
  } = useApp();

  // Ensure challenge data always resolves even during async load or cold start
  const challenge = activeChallenge || StorageService.getActiveChallenge();
  const startDateStr = challenge?.startDate || getTodayLocalDateStr();

  // Generate date string for any day number (1 - 90)
  const getDateForDayNumber = (dayNum: number): string => {
    try {
      const d = parseLocalDateStr(startDateStr);
      d.setDate(d.getDate() + (dayNum - 1));
      return formatDateToLocalStr(d);
    } catch {
      const d = new Date();
      d.setDate(d.getDate() + (dayNum - 1));
      return formatDateToLocalStr(d);
    }
  };

  const handleDayClick = (dayNum: number) => {
    const dateStr = getDateForDayNumber(dayNum);
    setSelectedDate(dateStr);
    setActiveTab('daily');
  };

  const handlePrevDay = () => {
    try {
      const curr = parseLocalDateStr(selectedDate);
      curr.setDate(curr.getDate() - 1);
      setSelectedDate(formatDateToLocalStr(curr));
    } catch {
      setSelectedDate(getTodayLocalDateStr());
    }
  };

  const handleToday = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  const handleNextDay = () => {
    try {
      const curr = parseLocalDateStr(selectedDate);
      curr.setDate(curr.getDate() + 1);
      setSelectedDate(formatDateToLocalStr(curr));
    } catch {
      setSelectedDate(getTodayLocalDateStr());
    }
  };

  const activeHabits = habits.filter((h) => h.active);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            🗓️ 90-Day Challenge Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Click any day box to inspect or update daily habit logs.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-1">
            <span>Selected: <strong className="text-indigo-300">{selectedDate}</strong></span>
            <span>•</span>
            <span>Day <strong className="text-indigo-300">{currentDayNumber}</strong> of 90</span>
          </div>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shadow min-h-[36px] flex items-center justify-center"
          >
            Today (Day {currentDayNumber})
          </button>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-300 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex-wrap">
        <span className="font-bold text-slate-400">Status Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-emerald-500/50" />
          <span>🟢 Excellent (≥80%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-amber-500/50" />
          <span>🟡 Average (50-79%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-rose-500/50" />
          <span>🔴 Low (&lt;50%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-700" />
          <span>⚪ Not Tracked</span>
        </div>
      </div>

      {/* 90-Day Grid Card */}
      <Card>
        <CardTitle>
          <CalendarDays className="w-5 h-5 text-indigo-400" /> Challenge Day Grid (1 - 90)
        </CardTitle>

        <div className="grid grid-cols-5 sm:grid-cols-9 md:grid-cols-10 gap-1.5 sm:gap-2 mt-4">
          {Array.from({ length: 90 }, (_, i) => {
            const dayNum = i + 1;
            const dateStr = getDateForDayNumber(dayNum);
            const tracker = trackers.find((t) => t.dayNumber === dayNum || t.date === dateStr);

            // Compute completion from logs directly if tracker is missing or as validation
            const dayLogs = logs.filter(
              (l) =>
                l.dailyTrackerId === `tracker-${dateStr}` ||
                l.dailyTrackerId === dateStr ||
                l.dailyTrackerId.includes(dateStr)
            );
            const computedCompletion = AnalyticsService.calculateDailyCompletionPercentage(dayLogs, activeHabits);
            const completion = tracker
              ? Math.max(tracker.completionPercentage, computedCompletion)
              : computedCompletion;
            const isTracked = Boolean(tracker || dayLogs.length > 0);

            const isSelected = selectedDate === dateStr;
            const isToday = currentDayNumber === dayNum;

            let statusBg = 'bg-slate-900 border-slate-800 text-slate-500';
            if (isTracked) {
              if (completion >= 80) {
                statusBg = 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900';
              } else if (completion >= 50) {
                statusBg = 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900';
              } else if (completion > 0) {
                statusBg = 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900';
              } else {
                statusBg = 'bg-slate-900/90 border-slate-700 text-slate-400 hover:bg-slate-800';
              }
            }

            let formattedMonthDay = '';
            try {
              const dObj = parseLocalDateStr(dateStr);
              formattedMonthDay = dObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch {
              formattedMonthDay = dateStr;
            }

            return (
              <button
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                aria-label={`Day ${dayNum} (${formattedMonthDay})${isTracked ? `, ${completion}% completed` : ', not tracked'}`}
                className={clsx(
                  'flex flex-col items-center justify-center p-1 sm:p-2 rounded-xl border text-[10px] sm:text-xs font-bold transition-all cursor-pointer aspect-square relative',
                  statusBg,
                  isSelected && 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10',
                  isToday && 'border-indigo-500 shadow-indigo-500/30'
                )}
              >
                {isToday && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                )}
                <span>Day {dayNum}</span>
                <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium opacity-80">{formattedMonthDay}</span>
                {isTracked ? (
                  <span className="text-[9px] sm:text-[10px] mt-0.5 font-bold">{completion}%</span>
                ) : (
                  <span className="text-[9px] sm:text-[10px] mt-0.5 opacity-40">•</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
