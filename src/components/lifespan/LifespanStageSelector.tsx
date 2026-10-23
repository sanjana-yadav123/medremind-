'use client';

import React from 'react';
import { LifespanStage } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';
import { useTranslation } from '@/lib/i18n';

interface LifespanStageSelectorProps {
  currentStage: LifespanStage;
  onStageChange: (stage: LifespanStage) => void;
}

export const LifespanStageSelector: React.FC<LifespanStageSelectorProps> = ({
  currentStage,
  onStageChange,
}) => {
  const { t } = useTranslation();

  const stages: {
    id: LifespanStage;
    emoji: string;
    label: string;
    ageRange: string;
    desc: string;
  }[] = [
    {
      id: 'infant',
      emoji: '🍼',
      label: t('lifespan.infant'),
      ageRange: t('lifespan.infantRange'),
      desc: t('lifespan.infantDesc'),
    },
    {
      id: 'child',
      emoji: '🧒',
      label: t('lifespan.child'),
      ageRange: t('lifespan.childRange'),
      desc: t('lifespan.childDesc'),
    },
    {
      id: 'adult',
      emoji: '🧑',
      label: t('lifespan.adult'),
      ageRange: t('lifespan.adultRange'),
      desc: t('lifespan.adultDesc'),
    },
    {
      id: 'senior',
      emoji: '🧓',
      label: t('lifespan.senior'),
      ageRange: t('lifespan.seniorRange'),
      desc: t('lifespan.seniorDesc'),
    },
  ];

  const handleSelect = (stage: LifespanStage) => {
    LocalDatabase.setLifespanStage(stage);
    onStageChange(stage);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-700 dark:text-slate-300">
          {t('lifespan.modeTitle')}
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {t('lifespan.allAgesBadge')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stages.map((st) => {
          const isSelected = currentStage === st.id;
          return (
            <button
              key={st.id}
              onClick={() => handleSelect(st.id)}
              title={st.desc}
              className={`p-3 rounded-2xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 shadow-sm ring-2 ring-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{st.emoji}</span>
                <div>
                  <span className="block text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {st.label}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {st.ageRange}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
