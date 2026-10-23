'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation, SUPPORTED_LANGUAGES, SupportedLocale } from '@/lib/i18n';
import { PhoneCall, Contrast, Globe, Settings as SettingsIcon, Check, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export const Header: React.FC = () => {
  const { locale, setLocale, currentLanguage } = useTranslation();
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  useEffect(() => {
    const savedContrast = localStorage.getItem('medremind_high_contrast') === 'true';
    setIsHighContrast(savedContrast);
    if (savedContrast) {
      document.documentElement.classList.add('contrast-more');
    }
  }, []);

  const toggleContrast = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    localStorage.setItem('medremind_high_contrast', String(next));
    if (next) {
      document.documentElement.classList.add('contrast-more');
    } else {
      document.documentElement.classList.remove('contrast-more');
    }
  };

  const handleSelectLanguage = (code: SupportedLocale) => {
    setLocale(code);
    setIsLangModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-900/85 border-b border-emerald-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="max-w-4xl mx-auto px-4 h-18 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-2xl group"
            aria-label="MedRemind होमपेज पर जाएँ"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-700 to-emerald-500 flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-105 transition-transform">
              💊
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-300 dark:to-teal-300 bg-clip-text text-transparent">
                MedRemind
              </span>
            </div>
          </Link>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick SOS Button */}
            <Link
              href="/emergency"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-sm min-h-[48px] focus:ring-4 focus:ring-red-400 active:scale-95 transition-all"
              aria-label="आपातकालीन संपर्क (Emergency SOS)"
            >
              <PhoneCall className="w-5 h-5 shrink-0 animate-pulse" aria-hidden="true" />
              <span>SOS</span>
            </Link>

            {/* Regional Language Picker Button */}
            <button
              onClick={() => setIsLangModalOpen(true)}
              className="px-3 py-2 bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border-2 border-emerald-200 dark:border-slate-700 font-bold text-base sm:text-lg rounded-2xl min-h-[48px] flex items-center gap-1.5 hover:bg-emerald-50 focus:ring-2 focus:ring-brand-500 transition-colors shadow-xs"
              aria-label="भाषा चुनें (Select Language)"
              title="भाषा चुनें"
            >
              <Globe className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>{currentLanguage.nativeLabel}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {/* Contrast Mode Toggle */}
            <button
              onClick={toggleContrast}
              className={`p-2.5 rounded-2xl border-2 min-h-[48px] min-w-[48px] flex items-center justify-center focus:ring-2 focus:ring-slate-400 transition-colors shadow-xs ${
                isHighContrast
                  ? 'bg-amber-400 text-black border-black font-bold'
                  : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
              aria-label="कंट्रास्ट बदलें (Toggle High Contrast)"
              title="कंट्रास्ट बदलें"
            >
              <Contrast className="w-5 h-5" />
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 min-h-[48px] min-w-[48px] flex items-center justify-center hover:bg-slate-100 focus:ring-2 focus:ring-brand-500 shadow-xs"
              aria-label="सेटिंग्स (Settings)"
            >
              <SettingsIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Language Selection Modal */}
      <Modal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        title="अपनी भाषा चुनें (Choose Your Language)"
      >
        <div className="space-y-3 py-2">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            आप ऐप और आवाज़ सहायक के लिए अपनी पसंदीदा भाषा चुन सकते हैं:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 font-bold text-xl min-h-[60px] transition-all text-left ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-brand-400'
                  }`}
                >
                  <div>
                    <span className="block text-xl font-black">{lang.nativeLabel}</span>
                    <span className="text-sm text-slate-500 font-semibold">{lang.englishLabel}</span>
                  </div>
                  {isSelected && (
                    <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Modal>
    </>
  );
};
