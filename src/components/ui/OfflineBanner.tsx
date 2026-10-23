'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getPendingSyncActions, flushSyncQueue } from '@/lib/offline/idb-store';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedJustNow, setSyncedJustNow] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      handleTriggerSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      checkPending();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkPending();
    const interval = setInterval(checkPending, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const checkPending = async () => {
    try {
      const actions = await getPendingSyncActions();
      setPendingCount(actions.length);
    } catch {
      // idb not available
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      await flushSyncQueue(async (action) => {
        const endpoint =
          action.actionType === 'confirm_dose'
            ? '/api/doses/confirm'
            : action.actionType === 'skip_dose'
            ? '/api/doses/skip'
            : '/api/doses/correct';

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.payload),
        });
        return res.ok;
      });
      await checkPending();
      setSyncedJustNow(true);
      setTimeout(() => setSyncedJustNow(false), 4000);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncedJustNow) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
        !isOnline
          ? 'bg-amber-100 dark:bg-amber-950 border-b-2 border-amber-500 text-amber-900 dark:text-amber-200'
          : syncedJustNow
          ? 'bg-green-100 dark:bg-green-950 border-b-2 border-green-600 text-green-900 dark:text-green-200'
          : 'bg-blue-100 dark:bg-blue-950 border-b-2 border-blue-600 text-blue-900 dark:text-blue-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {!isOnline ? (
          <WifiOff className="w-6 h-6 shrink-0 text-amber-700 dark:text-amber-400" />
        ) : syncedJustNow ? (
          <CheckCircle2 className="w-6 h-6 shrink-0 text-green-700 dark:text-green-400" />
        ) : (
          <RefreshCw className="w-6 h-6 shrink-0 text-blue-700 dark:text-blue-400 animate-spin" />
        )}
        <span className="text-lg font-bold">
          {!isOnline
            ? `ऑफ़लाइन मोड (No Internet) ${pendingCount > 0 ? `• ${pendingCount} बदलाव सहेजे गए हैं` : ''}`
            : syncedJustNow
            ? 'सभी बदलाव सफलतापूर्वक सिंक हो गए!'
            : `${pendingCount} बदलाव सर्वर पर भेजे जा रहे हैं...`}
        </span>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-blue-700 text-white font-bold rounded-xl hover:bg-blue-800 focus:ring-2 focus:ring-blue-400 min-h-[44px]"
        >
          {isSyncing ? 'सिंक हो रहा है...' : 'अभी सिंक करें (Sync)'}
        </button>
      )}
    </div>
  );
};
