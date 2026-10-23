'use client';

import React from 'react';
import { LifespanStage } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';

interface LifespanStageSelectorProps {
  currentStage: LifespanStage;
  onStageChange: (stage: LifespanStage) => void;
}

export const LIFESPAN_STAGES: {
  id: LifespanStage;
  emoji: string;
  labelHindi: string;
  labelEnglish: string;
  ageRange: string;
  desc: string;
}[] = [
  {
    id: 'infant',
    emoji: '🍼',
    labelHindi: 'शिशु (Infant)',
    labelEnglish: '0-2 Yrs',
    ageRange: '1 दिन से 2 वर्ष',
    desc: 'विटामिन D3 ड्रॉप्स, पोलियो व टीकाकरण चार्ट',
  },
  {
    id: 'child',
    emoji: '🧒',
    labelHindi: 'बालक (Child)',
    labelEnglish: '3-12 Yrs',
    ageRange: '3 से 12 वर्ष',
    desc: 'सिरप, च्यूएबल दवाइयाँ, बुखार व इन्फेक्शन',
  },
  {
    id: 'adult',
    emoji: '🧑',
    labelHindi: 'वयस्क (Adult)',
    labelEnglish: '13-59 Yrs',
    ageRange: '13 से 59 वर्ष',
    desc: 'दैनिक दिनचर्या, एसिडिटी, मल्टीविटामिन',
  },
  {
    id: 'senior',
    emoji: '🧓',
    labelHindi: 'वरिष्ठ (Senior)',
    labelEnglish: '60+ Yrs',
    ageRange: '60 वर्ष से आजीवन',
    desc: 'बीपी, शुगर, हार्ट केयर, बड़े बटन व वॉयस',
  },
];

export const LifespanStageSelector: React.FC<LifespanStageSelectorProps> = ({
  currentStage,
  onStageChange,
}) => {
  const handleSelect = (stage: LifespanStage) => {
    LocalDatabase.setLifespanStage(stage);
    onStageChange(stage);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-base font-bold text-slate-700 dark:text-slate-300">
          आयु वर्ग के अनुसार स्वास्थ्य प्रोफाइल (Lifespan Mode):
        </span>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          1 दिन से आजीवन (All Ages)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LIFESPAN_STAGES.map((st) => {
          const isSelected = currentStage === st.id;
          return (
            <button
              key={st.id}
              onClick={() => handleSelect(st.id)}
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
                    {st.labelHindi}
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
