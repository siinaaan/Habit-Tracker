import React, { useState, useEffect } from 'react';
import { habitService } from '../../services/habitService';
import type { SyncState } from '../../services/habitService';
import { RefreshCw, AlertTriangle, WifiOff, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export const SyncStatusIndicator: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>(habitService.getSyncState());

  useEffect(() => {
    const unsubscribe = habitService.subscribeSyncState((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = () => {
    habitService.syncPendingChanges();
  };

  const statusConfig = {
    synced: {
      label: 'Synced',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      badgeClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    },
    syncing: {
      label: 'Syncing...',
      icon: <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />,
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    },
    offline: {
      label: 'Offline',
      icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
      badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    },
    error: {
      label: 'Sync Error',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 cursor-pointer',
    },
  };

  const config = statusConfig[syncState] || statusConfig.synced;

  return (
    <button
      onClick={handleManualSync}
      title={syncState === 'error' ? 'Click to retry syncing pending local changes' : `Connection status: ${config.label}`}
      className={clsx(
        'px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all duration-200 cursor-pointer shadow-sm',
        config.badgeClass
      )}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
};
