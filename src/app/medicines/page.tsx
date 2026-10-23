'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Pill, Search, Edit } from 'lucide-react';
import { Medicine } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';

export default function MedicinesPage() {
  const { t } = useTranslation();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('all');

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = () => {
    const list = LocalDatabase.getMedicines();
    setMedicines(list);
  };

  const filtered = medicines.filter((m) => {
    const matchesArchived = showArchived ? m.is_archived : !m.is_archived;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.instructions.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === 'all' || m.lifespan_target === selectedStage;
    return matchesArchived && matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Pill className="w-7 h-7" />
            </div>
            <span>{t('medicines.title')}</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">
            {t('app.tagline')}
          </p>
        </div>

        <Link href="/medicines/new">
          <Button
            variant="primary"
            size="large"
            icon={<Plus className="w-7 h-7" />}
            className="text-xl shadow-md w-full sm:w-auto rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600"
          >
            {t('medicines.addNew')}
          </Button>
        </Link>
      </div>

      {/* Lifespan Age Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: t('medicines.allStages') },
          { id: 'infant', label: t('lifespan.infant') },
          { id: 'child', label: t('lifespan.child') },
          { id: 'adult', label: t('lifespan.adult') },
          { id: 'senior', label: t('lifespan.senior') },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSelectedStage(chip.id)}
            className={`px-3.5 py-2 rounded-xl font-bold text-base whitespace-nowrap transition-all border-2 ${
              selectedStage === chip.id
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('medicines.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 text-xl rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>

        <div className="flex rounded-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 font-bold text-lg min-h-[48px] ${
              !showArchived
                ? 'bg-emerald-700 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {t('medicines.activeMedicines')}
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 font-bold text-lg min-h-[48px] ${
              showArchived
                ? 'bg-emerald-700 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {t('medicines.archivedMedicines')}
          </button>
        </div>
      </div>

      {/* Medicines List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((med) => (
            <Card key={med.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0 mt-1 shadow-xs">
                  <Pill className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {med.name}
                    </h3>
                    {med.lifespan_target && (
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded-md border border-emerald-400">
                        {med.lifespan_target === 'infant' ? t('lifespan.infant') : med.lifespan_target === 'child' ? t('lifespan.child') : med.lifespan_target === 'adult' ? t('lifespan.adult') : t('lifespan.senior')}
                      </span>
                    )}
                    {med.is_prn && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-100 dark:bg-amber-950 dark:text-amber-200 px-2 py-0.5 rounded-md border border-amber-400">
                        {t('medicines.isPrn')}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                    {t('dashboard.doseAmount')}: {med.prescribed_dose} • {med.route === 'drops' ? t('dashboard.drops') : med.route === 'syrup' ? t('dashboard.syrup') : t('dashboard.tablet')}
                  </p>
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                    {t('medicines.instructions')}: &ldquo;{med.instructions}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link href={`/medicines/edit?id=${med.id}`}>
                  <Button
                    variant="secondary"
                    size="normal"
                    icon={<Edit className="w-5 h-5" />}
                    className="rounded-xl shadow-xs"
                  >
                    {t('medicines.editMedicine')}
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        ) : (
          <Card className="glass-card text-center py-10 space-y-3 rounded-3xl">
            <Pill className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300">
              {t('medicines.title')}
            </h3>
            <p className="text-lg text-slate-500">
              {t('medicines.addNew')}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
