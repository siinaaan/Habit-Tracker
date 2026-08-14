import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Loading challenge telemetry...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{message}</p>
    </div>
  );
};
