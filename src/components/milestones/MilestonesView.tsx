import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { AnalyticsService } from '../../services/analytics';
import { Trophy, CheckCircle2, Lock, Edit3 } from 'lucide-react';
import { clsx } from 'clsx';

export const MilestonesView: React.FC = () => {
  const { currentDayNumber, trackers, logs, habits, saveReflection } = useApp();
  const [selectedMilestoneDay, setSelectedMilestoneDay] = useState<number>(30);
  const [reflectionText, setReflectionText] = useState('');

  const milestones = [
    { day: 30, title: 'Day 30 — Foundation Locked', label: '1/3 Challenge Completed' },
    { day: 60, title: 'Day 60 — Momentum Unstoppable', label: '2/3 Challenge Completed' },
    { day: 90, title: 'Day 90 — Life Upgrade Achieved', label: 'Final Mastery Reached' },
  ];

  const handleSaveMilestoneReflection = () => {
    if (!reflectionText.trim()) return;
    saveReflection({
      id: `reflection-milestone-${selectedMilestoneDay}-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      challengeDay: selectedMilestoneDay,
      accomplished: `Milestone Day ${selectedMilestoneDay} reached!`,
      learned: reflectionText.trim(),
      wentWell: 'Maintained strong habit consistency.',
      shouldImprove: 'Keep scaling daily output.',
      mood: '🔥 Unstoppable',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
    setReflectionText('');
  };

  const spiritual = AnalyticsService.calculateCategoryConsistency('Spiritual', trackers, logs, habits);
  const learning = AnalyticsService.calculateCategoryConsistency('Learning', trackers, logs, habits);
  const fitness = AnalyticsService.calculateCategoryConsistency('Fitness', trackers, logs, habits);
  const health = AnalyticsService.calculateCategoryConsistency('Health', trackers, logs, habits);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
          🏆 Milestone Mastery Checkpoints
        </h2>
        <p className="text-xs text-slate-400">
          Evaluation matrix for Day 30, Day 60, and Day 90 benchmarks.
        </p>
      </div>

      {/* Milestone Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {milestones.map((m) => {
          const isReached = currentDayNumber >= m.day;
          const isSelected = selectedMilestoneDay === m.day;

          return (
            <button
              key={m.day}
              onClick={() => setSelectedMilestoneDay(m.day)}
              className={clsx(
                'flex flex-col items-start p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden',
                isSelected
                  ? 'bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border-indigo-500 shadow-xl shadow-indigo-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              )}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {m.label}
                </span>
                {isReached ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                )}
              </div>
              <h3 className="text-lg font-black text-white">{m.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isReached ? 'Checkpoint Unlocked' : `Day ${currentDayNumber} / ${m.day}`}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selected Milestone Detail Card */}
      <Card>
        <CardTitle>
          <Trophy className="w-5 h-5 text-amber-400" /> Milestone Day {selectedMilestoneDay} Telemetry Breakdown
        </CardTitle>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">🕌 Prayer Consistency</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{spiritual}%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">💻 Learning Discipline</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">{learning}%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">🏃 Fitness & Workout</p>
            <p className="text-2xl font-black text-purple-400 mt-1">{fitness}%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase">💧 Health Metrics</p>
            <p className="text-2xl font-black text-sky-400 mt-1">{health}%</p>
          </div>
        </div>

        {/* Milestone Reflection Entry */}
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" /> Add Milestone Day {selectedMilestoneDay} Reflection
          </label>
          <textarea
            rows={3}
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder={`Record key insights, breakthroughs, and mindsets unlocked at Day ${selectedMilestoneDay}...`}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 mb-3"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveMilestoneReflection}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Save Milestone Reflection
          </Button>
        </div>
      </Card>
    </div>
  );
};
