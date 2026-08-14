import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SidebarNavigation } from './components/layout/SidebarNavigation';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { ToastContainer } from './components/ui/Toast';

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
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'daily' && <DailyTrackerView />}
      {activeTab === 'analytics' && <AnalyticsCharts />}
      {activeTab === 'calendar' && <CalendarGrid />}
      {activeTab === 'weekly' && <WeeklyReportView />}
      {activeTab === 'goals' && <GoalsView />}
      {activeTab === 'reflections' && <ReflectionsView />}
      {activeTab === 'learning' && <LearningView />}
      {activeTab === 'milestones' && <MilestonesView />}
      {activeTab === 'pomodoro' && <PomodoroTimer />}
      {activeTab === 'settings' && <SettingsView />}
    </main>
  );
};

export function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
        <Header />
        <div className="flex flex-1">
          <SidebarNavigation />
          <MainContent />
        </div>
        <BottomNavigation />
        <ToastContainer />
      </div>
    </AppProvider>
  );
}

export default App;
