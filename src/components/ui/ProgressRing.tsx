import React from 'react';

interface ProgressRingProps {
  progress: number; // 0 - 100
  size?: number;    // diameter in px
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
}) => {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(30, 41, 59, 0.8)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black tracking-tight text-white">
          {safeProgress}%
        </span>
        {label && <span className="text-xs font-semibold text-slate-400 mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-indigo-400 font-medium">{sublabel}</span>}
      </div>
    </div>
  );
};
