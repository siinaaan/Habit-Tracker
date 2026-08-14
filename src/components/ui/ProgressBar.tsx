import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number; // 0 - 100
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'gradient';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  height = 'md',
  color = 'gradient',
  className,
}) => {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const colors = {
    indigo: 'bg-indigo-500 shadow-indigo-500/50',
    emerald: 'bg-emerald-500 shadow-emerald-500/50',
    amber: 'bg-amber-500 shadow-amber-500/50',
    rose: 'bg-rose-500 shadow-rose-500/50',
    gradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400',
  };

  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs font-semibold mb-1 text-slate-300">
          <span>Progress</span>
          <span>{safeProgress}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50', heights[height])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out shadow-sm', colors[color])}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};
