import React from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Compass, LayoutDashboard } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12 animate-fadeIn">
      <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6 shadow-xl shadow-indigo-500/10">
        <Compass className="w-12 h-12 animate-pulse" />
      </div>

      <span className="text-xs font-black tracking-widest uppercase text-indigo-400 mb-2">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
        Page Not Found
      </h1>

      <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved. Let's get you back on track with your habits.
      </p>

      <Button
        variant="primary"
        onClick={() => setActiveTab('dashboard')}
        icon={<LayoutDashboard className="w-4 h-4" />}
        className="shadow-lg shadow-indigo-600/30 px-6 py-2.5 text-sm font-bold cursor-pointer"
      >
        Back to Dashboard
      </Button>
    </div>
  );
};
