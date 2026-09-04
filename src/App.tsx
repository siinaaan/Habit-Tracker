import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SidebarNavigation } from './components/layout/SidebarNavigation';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ToastContainer } from './components/ui/Toast';
import { TaskModal } from './components/tasks/TaskModal';
import { HabitModal } from './components/habits/HabitModal';

import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { DailyTrackerView } from './views/DailyTrackerView';
import { AnalyticsCharts } from './components/analytics/AnalyticsCharts';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { WeeklyReportView } from './components/weekly/WeeklyReportView';
import { GoalsView } from './views/GoalsView';
import { ReflectionsView } from './views/ReflectionsView';
import { LearningView } from './views/LearningView';
import { MilestonesView } from './components/milestones/MilestonesView';
import { PomodoroTimer } from './components/pomodoro/PomodoroTimer';
import { ExpensesView } from './views/ExpensesView';
import { NotesView } from './views/NotesView';
import { SettingsView } from './views/SettingsView';
import { NotFoundView } from './views/NotFoundView';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { Flame } from 'lucide-react';

const VALID_TABS = new Set([
  'dashboard',
  'daily',
  'expenses',
  'notes',
  'analytics',
  'calendar',
  'weekly',
  'goals',
  'reflections',
  'learning',
  'milestones',
  'pomodoro',
  'settings',
]);

const MainContent: React.FC = () => {
  const { activeTab } = useApp();
  useDocumentTitle(activeTab);

  const isValidTab = VALID_TABS.has(activeTab);

  return (
    <main className="flex-1 min-w-0 h-full overflow-y-auto px-3 py-4 sm:p-5 md:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-12">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'daily' && <DailyTrackerView />}
      {activeTab === 'expenses' && <ExpensesView />}
      {activeTab === 'notes' && <NotesView />}
      {activeTab === 'analytics' && <AnalyticsCharts />}
      {activeTab === 'calendar' && <CalendarGrid />}
      {activeTab === 'weekly' && <WeeklyReportView />}
      {activeTab === 'goals' && <GoalsView />}
      {activeTab === 'reflections' && <ReflectionsView />}
      {activeTab === 'learning' && <LearningView />}
      {activeTab === 'milestones' && <MilestonesView />}
      {activeTab === 'pomodoro' && <PomodoroTimer />}
      {activeTab === 'settings' && <SettingsView />}
      {!isValidTab && <NotFoundView />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const {
    isAddTaskModalOpen,
    setIsAddTaskModalOpen,
    isAddHabitModalOpen,
    setIsAddHabitModalOpen,
    editingHabit,
    setEditingHabit,
    saveHabit,
  } = useApp();

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <SidebarNavigation />
        <MainContent />
      </div>
      <BottomNavigation />
      <ToastContainer />
      <TaskModal
        isOpen={isAddTaskModalOpen}
        onClose={() => setIsAddTaskModalOpen(false)}
      />
      <HabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => {
          setIsAddHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={saveHabit}
        initialHabit={editingHabit}
      />
    </div>
  );
};

const AuthenticatedAppGate: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-xl shadow-orange-500/20">
          <Flame className="w-8 h-8 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <AppProvider key={user.id}>
      <AppShell />
    </AppProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AuthenticatedAppGate />
    </AuthProvider>
  );
}

export default App;
