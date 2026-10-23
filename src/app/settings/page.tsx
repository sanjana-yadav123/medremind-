'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Settings as SettingsIcon,
  Bell,
  Globe,
  Type,
  Contrast,
  Download,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  RotateCcw,
} from 'lucide-react';
import { LocalDatabase } from '@/lib/offline/local-database';
import { AlarmService } from '@/lib/alarm/alarm-service';

export default function SettingsPage() {
  const { locale, setLocale, t } = useTranslation();
  const [textSize, setTextSize] = useState('large');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const savedContrast = localStorage.getItem('medremind_high_contrast') === 'true';
    setIsHighContrast(savedContrast);

    const savedSize = localStorage.getItem('medremind_text_size') || 'large';
    setTextSize(savedSize);
  }, []);

  const handleTextSizeChange = (size: string) => {
    setTextSize(size);
    localStorage.setItem('medremind_text_size', size);
    if (size === 'normal') {
      document.documentElement.style.setProperty('--font-base-size', '18px');
    } else if (size === 'large') {
      document.documentElement.style.setProperty('--font-base-size', '20px');
    } else if (size === 'extra-large') {
      document.documentElement.style.setProperty('--font-base-size', '24px');
    }
  };

  const handleContrastToggle = () => {
    const next = !isHighContrast;
    setIsHighContrast(next);
    localStorage.setItem('medremind_high_contrast', String(next));
    if (next) {
      document.documentElement.classList.add('contrast-more');
    } else {
      document.documentElement.classList.remove('contrast-more');
    }
  };

  const handleTestAlarm = () => {
    AlarmService.testAlarmNow();
  };

  const handleExportData = () => {
    try {
      const exportPayload = LocalDatabase.exportBundle();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `medremind_health_records_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setNotice('आपका संपूर्ण स्वास्थ्य डेटा सफलतापूर्वक डाउनलोड हो गया!');
      setTimeout(() => setNotice(null), 4000);
    } catch {
      alert('डेटा डाउनलोड करने में समस्या आई।');
    }
  };

  const handleResetData = () => {
    LocalDatabase.resetDatabase();
    setIsDeleteModalOpen(false);
    setNotice('डेटाबेस सफलतापूर्वक रीसेट कर दिया गया।');
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
            <SettingsIcon className="w-7 h-7" />
          </div>
          <span>{t('settings.title')}</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mt-1 font-semibold">
          स्थानीय डेटाबेस, अलार्म ध्वनि एवं 7 क्षेत्रीय भाषाएँ
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 rounded-3xl text-emerald-950 dark:text-emerald-200 text-lg font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* LANGUAGE PREFERENCE */}
      <Card className="glass-card p-5 space-y-4 rounded-3xl">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-emerald-700" />
          <span>{t('settings.language')} (7 भारतीय भाषाएँ)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code)}
              className={`py-3 px-3 rounded-2xl border-2 font-bold text-lg min-h-[52px] transition-all ${
                locale === lang.code
                  ? 'bg-emerald-700 text-white border-emerald-900 shadow-sm'
                  : 'bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200'
              }`}
            >
              {lang.nativeLabel}
            </button>
          ))}
        </div>
      </Card>

      {/* ALARM SYSTEM CONTROLS */}
      <Card className="glass-card p-5 space-y-4 rounded-3xl border-2 border-red-200">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-6 h-6 text-red-600 animate-bounce" />
            <span>दवा अलार्म सिस्टम (Real In-Browser Alarm)</span>
          </h3>
          <span className="text-xs font-bold px-2.5 py-1 bg-red-100 text-red-900 rounded-full border border-red-400">
            सक्रिय (Active)
          </span>
        </div>
        <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
          दवा का समय होने पर तेज़ अलर्ट साउंड बजता है और वाइब्रेशन होती है। इसे आप अभी सुनकर टेस्ट कर सकते हैं।
        </p>
        <Button
          variant="danger"
          size="large"
          icon={<Bell className="w-6 h-6" />}
          onClick={handleTestAlarm}
          className="w-full text-xl rounded-2xl shadow-md"
        >
          🔊 अलार्म का परीक्षण करें (Test Alarm Ring)
        </Button>
      </Card>

      {/* ACCESSIBILITY: TEXT SIZE & HIGH CONTRAST */}
      <Card className="glass-card p-5 space-y-4 rounded-3xl">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Type className="w-6 h-6 text-emerald-700" />
          <span>{t('settings.textSize')}</span>
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {['normal', 'large', 'extra-large'].map((sz) => (
            <button
              key={sz}
              onClick={() => handleTextSizeChange(sz)}
              className={`py-3 px-2 rounded-2xl border-2 font-bold text-lg min-h-[52px] ${
                textSize === sz
                  ? 'bg-emerald-700 text-white border-emerald-900'
                  : 'bg-white/90 dark:bg-slate-800 text-slate-700 border-slate-300'
              }`}
            >
              {sz === 'normal'
                ? t('settings.textNormal')
                : sz === 'large'
                ? t('settings.textLarge')
                : t('settings.textExtraLarge')}
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Contrast className="w-5 h-5" />
              <span>{t('settings.highContrast')}</span>
            </h4>
            <p className="text-base text-slate-500 font-medium">कम रोशनी में पढ़ने में सुलभ</p>
          </div>
          <button
            onClick={handleContrastToggle}
            className={`px-4 py-2 rounded-2xl font-bold text-lg min-h-[48px] border-2 ${
              isHighContrast
                ? 'bg-amber-400 text-black border-black font-black'
                : 'bg-slate-200 text-slate-800 border-slate-400'
            }`}
          >
            {isHighContrast ? 'चालू (ON)' : 'बंद (OFF)'}
          </button>
        </div>
      </Card>

      {/* DATA PRIVACY & EXPORT (100% LOCAL DATABASE) */}
      <Card className="glass-card p-5 space-y-4 rounded-3xl">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-700" />
          <span>स्थानीय डेटाबेस एवं गोपनीयता (Zero Cloud Required)</span>
        </h3>
        <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
          आपका पूरा स्वास्थ्य डेटा 100% आपके अपने कंप्यूटर/ब्राउज़र में स्थानीय रूप से सुरक्षित है। किसी भी बाहरी सर्वर या क्लाउड की आवश्यकता नहीं है।
        </p>

        <div className="space-y-3 pt-2">
          <Button
            variant="secondary"
            size="large"
            icon={<Download className="w-6 h-6" />}
            onClick={handleExportData}
            className="w-full text-xl rounded-2xl shadow-xs"
          >
            {t('settings.exportData')} (JSON)
          </Button>

          <Button
            variant="outline"
            size="large"
            icon={<RotateCcw className="w-6 h-6 text-red-600" />}
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full text-xl text-red-700 border-red-300 rounded-2xl"
          >
            डेटा रीसेट करें (Reset Local Database)
          </Button>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="डेटा रीसेट की पुष्टि"
      >
        <div className="space-y-4 text-center">
          <div className="p-4 bg-red-100 rounded-2xl border-2 border-red-600 flex items-start gap-3 text-left">
            <AlertTriangle className="w-8 h-8 text-red-700 shrink-0 mt-0.5" />
            <p className="text-base font-bold text-red-950">
              क्या आप स्थानीय डेटाबेस को रीसेट करके मूल डिफ़ॉल्ट दवाओं को पुनर्स्थापित करना चाहते हैं?
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="large"
              onClick={handleResetData}
              className="flex-1 text-xl rounded-2xl"
            >
              हाँ, रीसेट करें
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 text-xl rounded-2xl"
            >
              रद्द करें
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
