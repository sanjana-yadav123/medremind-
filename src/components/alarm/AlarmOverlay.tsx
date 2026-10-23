'use client';

import React, { useState, useEffect } from 'react';
import { AlarmService, ActiveAlarm } from '@/lib/alarm/alarm-service';
import { LocalDatabase } from '@/lib/offline/local-database';
import { Button } from '@/components/ui/Button';
import { Bell, Check, Clock, Volume2, ShieldAlert } from 'lucide-react';

export const AlarmOverlay: React.FC = () => {
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);

  useEffect(() => {
    const unsubscribe = AlarmService.onAlarm((alarm) => {
      setActiveAlarm(alarm);
    });
    return unsubscribe;
  }, []);

  if (!activeAlarm) return null;

  const handleTookMedicine = () => {
    // Record in local database
    if (activeAlarm.doseEventId && !activeAlarm.doseEventId.startsWith('test_')) {
      LocalDatabase.recordDoseAction(
        activeAlarm.doseEventId,
        'take',
        'unknown',
        new Date().toISOString(),
        'अलार्म से पुष्टि की गई'
      );
    }
    AlarmService.dismissAlarm();
    // Dispatch custom event to refresh dashboard
    window.dispatchEvent(new Event('medremind_dose_updated'));
  };

  const handleSnooze = () => {
    AlarmService.snoozeAlarm(10);
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alarm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-4 border-red-600 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
        {/* Blinking Urgent Bell Animation */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-red-400/30 animate-ping" />
          <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-xl">
            <Bell className="w-12 h-12 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-block px-4 py-1.5 bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-200 font-black text-xl rounded-full border border-red-500">
            ⏰ दवा का समय हो गया है!
          </span>
          <h2 id="alarm-title" className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white pt-1">
            {activeAlarm.medicineName}
          </h2>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            खुराक: {activeAlarm.dose}
          </p>
        </div>

        {/* Doctor's exact instructions */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border-2 border-emerald-400 text-left">
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            डॉक्टर के निर्देश:
          </span>
          <p className="text-xl font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
            {activeAlarm.instructions}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            size="huge"
            icon={<Check className="w-8 h-8" />}
            onClick={handleTookMedicine}
            className="w-full text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl min-h-[72px]"
          >
            ✓ दवा ले ली (अलार्म बंद करें)
          </Button>

          <Button
            variant="warning"
            size="large"
            icon={<Clock className="w-6 h-6" />}
            onClick={handleSnooze}
            className="w-full text-xl font-bold rounded-2xl min-h-[56px]"
          >
            ⏰ 10 मिनट बाद याद दिलाएँ (Snooze)
          </Button>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
          यदि कोई समस्या हो तो तुरंत आपातकालीन संपर्क या डॉक्टर से परामर्श लें।
        </p>
      </div>
    </div>
  );
};
