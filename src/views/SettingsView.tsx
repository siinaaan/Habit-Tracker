import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { HabitManager } from '../components/habits/HabitManager';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  Sliders,
  Flame,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';
import { clsx } from 'clsx';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    activeChallenge,
    saveChallenge,
    resetToNewChallenge,
    clearAllData,
    importBackupData,
  } = useApp();

  const [subTab, setSubTab] = useState<'general' | 'habits'>('general');

  // Challenge edit state
  const [challengeName, setChallengeName] = useState(activeChallenge?.name || '90-Day Upgrade');
  const [challengeStart, setChallengeStart] = useState(
    activeChallenge?.startDate || new Date().toISOString().split('T')[0]
  );
  const [challengeDesc, setChallengeDesc] = useState(
    activeChallenge?.description || '90-day personal improvement system'
  );

  // Confirmation dialogs state
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // JSON File upload ref
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleSaveChallengeInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge) return;

    saveChallenge({
      ...activeChallenge,
      name: challengeName,
      startDate: challengeStart,
      description: challengeDesc,
    });
  };

  const handleExportJSON = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `90_DAYS_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    const csvStr = StorageService.exportDailyLogsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `90_DAYS_daily_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
            ⚙️ Settings & System Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Manage habits, themes, challenge dates, and backup data.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1">
          <button
            onClick={() => setSubTab('general')}
            className={clsx(
              'px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2',
              subTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Sliders className="w-4 h-4" /> Preferences & Data
          </button>
          <button
            onClick={() => setSubTab('habits')}
            className={clsx(
              'px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2',
              subTab === 'habits'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <ListTodo className="w-4 h-4" /> Manage Habits CRUD
          </button>
        </div>
      </div>

      {subTab === 'habits' ? (
        <HabitManager />
      ) : (
        <div className="space-y-6">
          {/* Challenge CRUD & Info */}
          <Card>
            <CardTitle>
              <Flame className="w-5 h-5 text-orange-500" /> Challenge Configuration CRUD
            </CardTitle>

            <form onSubmit={handleSaveChallengeInfo} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    required
                    value={challengeName}
                    onChange={(e) => setChallengeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Start Date (Day 1)
                  </label>
                  <input
                    type="date"
                    required
                    value={challengeStart}
                    onChange={(e) => setChallengeStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Description & Mission Statement
                </label>
                <input
                  type="text"
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                  Save Challenge Info
                </Button>
              </div>
            </form>
          </Card>

          {/* Pomodoro & Metric Preferences */}
          <Card>
            <CardTitle>
              <Sliders className="w-5 h-5 text-indigo-400" /> Focus & Target Preferences
            </CardTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Pomodoro Focus (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.pomodoroSettings.focusDuration}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      pomodoroSettings: {
                        ...settings.pomodoroSettings,
                        focusDuration: parseInt(e.target.value, 10) || 50,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Short Break (Minutes)
                </label>
                <input
                  type="number"
                  value={settings.pomodoroSettings.shortBreakDuration}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      pomodoroSettings: {
                        ...settings.pomodoroSettings,
                        shortBreakDuration: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Daily Water Goal (Litres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.waterGoal}
                  onChange={(e) =>
                    updateSettings({
                      ...settings,
                      waterGoal: parseFloat(e.target.value) || 2.5,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>
            </div>
          </Card>

          {/* Data Export / Import Management */}
          <Card>
            <CardTitle>
              <Download className="w-5 h-5 text-emerald-400" /> Data Export & Import Management
            </CardTitle>

            <p className="text-xs text-slate-400 mt-1 mb-4">
              Backup your entire 90-day challenge history, habits, reflections, and metrics offline.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleExportJSON}
                icon={<Download className="w-4 h-4 text-emerald-400" />}
              >
                Export JSON Backup
              </Button>

              <Button
                variant="secondary"
                onClick={handleExportCSV}
                icon={<Download className="w-4 h-4 text-sky-400" />}
              >
                Export Logs CSV
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                icon={<Upload className="w-4 h-4 text-indigo-400" />}
              >
                Import JSON Backup
              </Button>
            </div>
          </Card>

          {/* Destructive Actions */}
          <Card className="border-rose-500/30 bg-rose-950/10">
            <CardTitle className="text-rose-400">
              <Trash2 className="w-5 h-5 text-rose-400" /> Reset & Destructive Controls
            </CardTitle>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Button
                variant="danger"
                onClick={() => setConfirmResetOpen(true)}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reset Challenge to Day 1
              </Button>

              <Button
                variant="outline"
                onClick={() => setConfirmClearOpen(true)}
                icon={<Trash2 className="w-4 h-4 text-rose-400" />}
                className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
              >
                Clear All Application Data
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmationDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={() => resetToNewChallenge(activeChallenge?.name || '90-Day Upgrade')}
        title="Reset Challenge to Day 1"
        message="Are you sure you want to reset your challenge? All current daily tracking records will be reset to Day 1."
      />

      {/* Clear All Confirmation */}
      <ConfirmationDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearAllData}
        title="Clear All Application Data"
        message="Are you sure you want to wipe all stored challenge data, habits, reflections, and goals? This action cannot be undone."
      />
    </div>
  );
};
