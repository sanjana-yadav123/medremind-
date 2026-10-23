'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';
import { MedicineRoute, ScheduleType, LifespanStage } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';

export default function NewMedicinePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState<MedicineRoute>('oral');
  const [lifespanTarget, setLifespanTarget] = useState<LifespanStage>('senior');
  const [instructions, setInstructions] = useState('');
  const [isPrn, setIsPrn] = useState(false);
  const [scheduleType, setScheduleType] = useState<ScheduleType>('once_daily');
  const [timesOfDay, setTimesOfDay] = useState<string[]>(['08:30']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFrequencyChange = (type: ScheduleType) => {
    setScheduleType(type);
    if (type === 'once_daily') {
      setTimesOfDay(['08:30']);
    } else if (type === 'multiple_daily') {
      setTimesOfDay(['08:30', '20:30']);
    } else if (type === 'as_needed') {
      setTimesOfDay([]);
      setIsPrn(true);
    }
  };

  const handleAddTime = () => {
    setTimesOfDay([...timesOfDay, '14:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimesOfDay(timesOfDay.filter((_, i) => i !== index));
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...timesOfDay];
    updated[index] = val;
    setTimesOfDay(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !prescribedDose || !instructions) {
      setErrorMsg(t('medicines.errorRequired'));
      return;
    }

    setIsLoading(true);

    try {
      // 1. Add Medicine to Local Database
      const newMed = LocalDatabase.addMedicine({
        patient_id: 'local_user',
        name,
        prescribed_dose: prescribedDose,
        route,
        instructions,
        is_prn: isPrn,
        is_archived: false,
        lifespan_target: lifespanTarget,
      });

      // 2. Add Schedule
      if (!isPrn && timesOfDay.length > 0) {
        LocalDatabase.addSchedule({
          medicine_id: newMed.id,
          patient_id: 'local_user',
          schedule_type: scheduleType,
          times_of_day: timesOfDay,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          start_date: startDate,
          end_date: endDate || null,
          is_active: true,
          deduplication_hash: `sched_${newMed.id}_${Date.now()}`,
        });
      }

      router.push('/medicines');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving medicine');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Link
        href="/medicines"
        className="inline-flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-bold text-lg hover:underline"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>{t('medicines.backToList')}</span>
      </Link>

      <Card className="glass-card space-y-6 p-6 sm:p-8 rounded-3xl">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {t('medicines.addNew')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t('app.tagline')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-900 rounded-2xl border-2 border-red-600 flex items-start gap-2.5">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <span className="text-lg font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lifespan Age Category Selector */}
          <div className="space-y-2">
            <label className="text-xl font-bold text-slate-900 dark:text-slate-100 block">
              {t('medicines.targetAgeGroup')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'infant', label: t('lifespan.infant') },
                { id: 'child', label: t('lifespan.child') },
                { id: 'adult', label: t('lifespan.adult') },
                { id: 'senior', label: t('lifespan.senior') },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setLifespanTarget(st.id as LifespanStage)}
                  className={`py-3 px-2 rounded-2xl border-2 font-bold text-lg min-h-[50px] transition-all ${
                    lifespanTarget === st.id
                      ? 'border-emerald-600 bg-emerald-100 text-emerald-950 font-black shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={t('medicines.medicineName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amlodipine, Paracetamol, Vitamin D3"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('medicines.prescribedDose')}
              value={prescribedDose}
              onChange={(e) => setPrescribedDose(e.target.value)}
              placeholder="e.g. 500mg, 1 tablet, 5ml"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('medicines.route')}
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as MedicineRoute)}
                className="min-h-[52px] px-4 py-3 text-xl rounded-2xl border-2 border-slate-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="oral">{t('medicines.routeOral')}</option>
                <option value="drops">{t('medicines.routeDrops')}</option>
                <option value="syrup">{t('medicines.routeSyrup')}</option>
                <option value="injection">{t('medicines.routeInjection')}</option>
                <option value="inhalation">{t('medicines.routeInhalation')}</option>
                <option value="topical">{t('medicines.routeTopical')}</option>
                <option value="other">{t('medicines.routeOther')}</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('medicines.instructions')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('medicines.instructionsPlaceholder')}
              rows={3}
              className="px-4 py-3 text-xl rounded-2xl border-2 border-slate-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* As-Needed PRN Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border-2 border-amber-300">
            <input
              id="is-prn"
              type="checkbox"
              checked={isPrn}
              onChange={(e) => {
                setIsPrn(e.target.checked);
                if (e.target.checked) setScheduleType('as_needed');
              }}
              className="w-6 h-6 mt-1 rounded text-amber-600 cursor-pointer"
            />
            <label htmlFor="is-prn" className="text-lg font-bold text-amber-950 cursor-pointer">
              {t('medicines.isPrn')}
            </label>
          </div>

          {/* Schedule Configuration */}
          {!isPrn && (
            <div className="space-y-4 p-5 bg-emerald-50/70 dark:bg-slate-800/60 rounded-3xl border-2 border-emerald-200 dark:border-slate-700">
              <label className="text-xl font-bold text-slate-900 dark:text-slate-100 block">
                {t('medicines.scheduleType')}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('once_daily')}
                  className={`py-3 px-3 rounded-2xl border-2 font-bold text-lg min-h-[52px] ${
                    scheduleType === 'once_daily'
                      ? 'border-emerald-700 bg-emerald-100 text-emerald-950 font-black'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {t('medicines.onceDaily')}
                </button>
                <button
                  type="button"
                  onClick={() => handleFrequencyChange('multiple_daily')}
                  className={`py-3 px-3 rounded-2xl border-2 font-bold text-lg min-h-[52px] ${
                    scheduleType === 'multiple_daily'
                      ? 'border-emerald-700 bg-emerald-100 text-emerald-950 font-black'
                      : 'border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  {t('medicines.twiceDaily')}
                </button>
              </div>

              {/* Time pickers */}
              <div className="space-y-2 pt-2">
                <label className="text-lg font-bold text-slate-800 dark:text-slate-200 block">
                  {t('medicines.customTimes')}:
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  {timesOfDay.map((time, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(idx, e.target.value)}
                        className="px-3 py-2 text-xl font-bold rounded-xl border-2 border-slate-300 bg-white dark:bg-slate-700 min-h-[48px]"
                      />
                      {timesOfDay.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(idx)}
                          className="px-2 py-1 text-red-600 font-bold text-xl hover:bg-red-50 rounded-lg min-h-[48px]"
                          aria-label="Remove time"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-900 font-bold rounded-xl min-h-[48px]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>+</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('medicines.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label={t('medicines.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="huge"
              disabled={isLoading}
              className="flex-1 rounded-2xl shadow-xl"
            >
              {isLoading ? '...' : t('medicines.save')}
            </Button>
            <Link href="/medicines" className="flex-1">
              <Button type="button" variant="secondary" size="huge" className="w-full rounded-2xl">
                {t('medicines.cancel')}
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
