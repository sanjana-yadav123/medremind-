'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import hi from '@/i18n/hi.json';
import en from '@/i18n/en.json';
import bn from '@/i18n/bn.json';
import mr from '@/i18n/mr.json';
import ta from '@/i18n/ta.json';
import te from '@/i18n/te.json';
import gu from '@/i18n/gu.json';

export type SupportedLocale = 'hi' | 'en' | 'bn' | 'mr' | 'ta' | 'te' | 'gu';

export interface LanguageOption {
  code: SupportedLocale;
  nativeLabel: string;
  englishLabel: string;
  voiceLang: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', nativeLabel: 'हिंदी', englishLabel: 'Hindi', voiceLang: 'hi-IN' },
  { code: 'en', nativeLabel: 'English', englishLabel: 'English', voiceLang: 'en-IN' },
  { code: 'bn', nativeLabel: 'বাংলা', englishLabel: 'Bengali', voiceLang: 'bn-IN' },
  { code: 'mr', nativeLabel: 'मराठी', englishLabel: 'Marathi', voiceLang: 'mr-IN' },
  { code: 'ta', nativeLabel: 'தமிழ்', englishLabel: 'Tamil', voiceLang: 'ta-IN' },
  { code: 'te', nativeLabel: 'తెలుగు', englishLabel: 'Telugu', voiceLang: 'te-IN' },
  { code: 'gu', nativeLabel: 'ગુજરાતી', englishLabel: 'Gujarati', voiceLang: 'gu-IN' },
];

const translations: Record<SupportedLocale, any> = { hi, en, bn, mr, ta, te, gu };

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currentLanguage: LanguageOption;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'hi',
  setLocale: () => {},
  t: (key) => key,
  currentLanguage: SUPPORTED_LANGUAGES[0],
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('hi');

  useEffect(() => {
    const saved = localStorage.getItem('medremind_locale') as SupportedLocale | null;
    if (saved && saved in translations) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = 'hi';
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('medremind_locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === locale) || SUPPORTED_LANGUAGES[0];

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let current: any = translations[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to Hindi if regional language key missing
        let fallback: any = translations['hi'];
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') return path;

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, current);
    }

    return current;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, currentLanguage }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
