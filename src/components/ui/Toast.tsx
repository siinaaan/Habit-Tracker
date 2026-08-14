import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  };

  const borderColors = {
    success: 'border-emerald-500/40 bg-slate-900/90 text-slate-100',
    error: 'border-rose-500/40 bg-slate-900/90 text-slate-100',
    warning: 'border-amber-500/40 bg-slate-900/90 text-slate-100',
    info: 'border-indigo-500/40 bg-slate-900/90 text-slate-100',
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl pointer-events-auto transition-all transform duration-300 animate-slideUp',
            borderColors[toast.type]
          )}
        >
          <div className="flex items-center gap-3">
            {icons[toast.type]}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
