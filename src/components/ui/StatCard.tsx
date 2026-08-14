import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  trend,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:scale-[1.02]'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="text-2xl font-black tracking-tight text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>

        <div
          className={clsx(
            'p-3 rounded-2xl border flex items-center justify-center text-xl shrink-0',
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={clsx(
              trend.direction === 'up'
                ? 'text-emerald-400'
                : trend.direction === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            )}
          >
            {trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '•'} {trend.value}
          </span>
          <span className="text-slate-500 font-normal">vs previous period</span>
        </div>
      )}
    </Card>
  );
};
