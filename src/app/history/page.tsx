'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { History, Edit3, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DoseEvent, DoseStatus } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';

export default function HistoryPage() {
  const { t, currentLanguage } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [correctionTarget, setCorrectionTarget] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<DoseStatus>('skipped');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const rawEvents = LocalDatabase.getDoseEvents();
    const medicines = LocalDatabase.getMedicines();

    if (rawEvents.length === 0) {
      // Seed initial sample events if empty for realistic review
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      setEvents([
        {
          id: 'dose_demo_1',
          medicine_name: 'एम्लोडिपिन (Amlodipine 5mg)',
          scheduled_for: now.toISOString(),
          status: 'taken',
          confirmed_at: now.toISOString(),
          confirmation_source: 'patient',
          notes: 'समय पर ली गई (अलार्म से)',
        },
        {
          id: 'dose_demo_2',
          medicine_name: 'मेटफ़ॉर्मिन (Metformin 500mg)',
          scheduled_for: yesterday.toISOString(),
          status: 'taken',
          confirmed_at: yesterday.toISOString(),
          confirmation_source: 'patient',
          notes: 'डिनर के बाद ली गई',
        },
        {
          id: 'dose_demo_3',
          medicine_name: 'पैंटोप्राजोल (Pantoprazole 40mg)',
          scheduled_for: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'missed',
          confirmed_at: null,
          confirmation_source: 'system',
          notes: 'समय पर पुष्टि नहीं हुई',
        },
      ]);
    } else {
      const formatted = rawEvents.map((ev) => {
        const med = medicines.find((m) => m.id === ev.medicine_id);
        return {
          id: ev.id,
          medicine_name: med ? `${med.name} (${med.prescribed_dose})` : 'दवा',
          scheduled_for: ev.scheduled_for,
          status: ev.status,
          confirmed_at: ev.confirmed_at,
          confirmation_source: ev.confirmation_source,
          notes: ev.notes,
        };
      });
      setEvents(formatted);
    }
  };

  const handleOpenCorrection = (eventItem: any) => {
    setCorrectionTarget(eventItem);
    setNewStatus(eventItem.status === 'taken' ? 'skipped' : 'taken');
    setCorrectionReason('');
    setIsModalOpen(true);
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason || correctionReason.length < 3) {
      alert('कृपया सुधार का कारण दर्ज करें (कम से कम 3 अक्षर)');
      return;
    }

    LocalDatabase.correctDose(correctionTarget.id, newStatus, correctionReason);

    setEvents((prev) =>
      prev.map((item) =>
        item.id === correctionTarget.id
          ? {
              ...item,
              status: newStatus,
              notes: `सुधार: ${correctionReason}`,
              confirmed_at: new Date().toISOString(),
            }
          : item
      )
    );

    setIsModalOpen(false);
    setSuccessNotice('रिकॉर्ड सफलतापूर्वक संशोधित किया गया (ऑडिट ट्रेल दर्ज)।');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const filtered = events.filter((ev) => {
    if (filterStatus === 'all') return true;
    return ev.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <History className="w-7 h-7" />
          </div>
          <span>{t('history.title')}</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">
          {t('history.subtitle')}
        </p>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 rounded-3xl text-emerald-950 dark:text-emerald-200 text-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Safety Alert Reminder */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-400 text-amber-950 dark:text-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5 text-amber-700" />
        <p className="text-base font-bold">
          चिकित्सा सुरक्षा नियम: छूटी हुई दवा की भरपाई के लिए कभी भी एक साथ दोहरी (डबल) खुराक न लें। किसी भी संशय की स्थिति में अपने डॉक्टर या फार्मासिस्ट से परामर्श लें।
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'taken', 'missed', 'skipped'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl font-bold text-lg min-h-[48px] border-2 transition-all ${
              filterStatus === st
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
            }`}
          >
            {st === 'all'
              ? t('history.filterAll')
              : st === 'taken'
              ? t('history.filterTaken')
              : st === 'missed'
              ? t('history.filterMissed')
              : t('history.filterSkipped')}
          </button>
        ))}
      </div>

      {/* History Items */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((ev) => {
            const dateObj = new Date(ev.scheduled_for);
            const dateFormatted = dateObj.toLocaleDateString(currentLanguage.voiceLang, {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Card key={ev.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {ev.medicine_name || 'दवा'}
                    </h3>
                    <Badge status={ev.status} />
                  </div>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    समय: {dateFormatted}
                  </p>
                  {ev.confirmed_at && (
                    <p className="text-sm text-slate-500 font-semibold">
                      पुष्टि: {ev.confirmation_source || 'मरीज़'}
                    </p>
                  )}
                  {ev.notes && (
                    <p className="text-base text-slate-800 dark:text-slate-200 font-bold italic">
                      नोट: {ev.notes}
                    </p>
                  )}
                </div>

                <div className="self-end sm:self-auto">
                  <Button
                    variant="outline"
                    size="normal"
                    icon={<Edit3 className="w-5 h-5" />}
                    onClick={() => handleOpenCorrection(ev)}
                    className="text-base rounded-xl"
                  >
                    {t('history.editRecord')}
                  </Button>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="glass-card text-center py-8 text-slate-500 text-xl font-bold rounded-3xl">
            कोई रिकॉर्ड नहीं मिला।
          </Card>
        )}
      </div>

      {/* Correction Modal */}
      {correctionTarget && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t('history.editRecord')}
        >
          <form onSubmit={handleSubmitCorrection} className="space-y-4">
            <p className="text-lg text-slate-700 dark:text-slate-300">
              दवा:{' '}
              <strong className="text-slate-900 dark:text-white">
                {correctionTarget.medicine_name}
              </strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-lg font-bold text-slate-900 dark:text-slate-100">
                नई स्थिति चुनें (Corrected Status):
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as DoseStatus)}
                className="w-full min-h-[50px] px-3 py-2 text-xl rounded-2xl border-2 border-slate-400 bg-white dark:bg-slate-800 font-bold"
              >
                <option value="taken">ले ली गई (Taken)</option>
                <option value="skipped">छोड़ दी (Skipped)</option>
                <option value="missed">छूट गई (Missed)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('history.reasonForCorrection')} (अनिवार्य):
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="जैसे: गलती से बटन दब गया था, वास्तव में दवा नहीं ली थी"
                rows={3}
                required
                className="w-full px-4 py-2 text-xl rounded-2xl border-2 border-slate-400 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="primary" size="large" className="flex-1 rounded-2xl">
                {t('history.saveCorrection')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 rounded-2xl"
              >
                रद्द करें
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
