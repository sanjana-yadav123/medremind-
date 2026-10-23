'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Shield, HeartPulse, UserCheck, Smartphone } from 'lucide-react';

export default function WelcomePage() {
  const { t } = useTranslation();

  const handleStartDemo = () => {
    // Set demo token/state in local storage for instant synthetic testing
    localStorage.setItem('medremind_demo_mode', 'true');
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-8 text-center max-w-2xl mx-auto">
      {/* App Emblem */}
      <div className="w-24 h-24 rounded-3xl bg-brand-700 flex items-center justify-center text-white text-5xl shadow-xl">
        💊
      </div>

      <div className="space-y-3">
        <h1 className="text-4xl sm:text-5xl font-black text-brand-900 dark:text-brand-300 tracking-tight">
          MedRemind
        </h1>
        <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
          वरिष्ठ स्वास्थ्य एवं दवा सहायक
        </p>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          बुजुर्गों और उनके परिवारों के लिए सरल, हिंदी-प्रथम और भरोसेमंद दवा अनुस्मारक।
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
        <Card className="flex items-start gap-3">
          <CheckCircle2 className="w-7 h-7 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">समय पर याद दिलाए</h3>
            <p className="text-base text-slate-600 dark:text-slate-400">बड़े अक्षरों और हिंदी आवाज़ में दवा का समय बताता है।</p>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <UserCheck className="w-7 h-7 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">परिवार से जुड़े रहें</h3>
            <p className="text-base text-slate-600 dark:text-slate-400">दवा छूटने पर देखभालकर्ता (केयरगिवर) को अलर्ट मिलता है।</p>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <Smartphone className="w-7 h-7 text-purple-700 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">ऑफ़लाइन भी कार्य करे</h3>
            <p className="text-base text-slate-600 dark:text-slate-400">इंटरनेट न होने पर भी दवा का रिकॉर्ड दर्ज कर सकते हैं।</p>
          </div>
        </Card>

        <Card className="flex items-start gap-3">
          <HeartPulse className="w-7 h-7 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">त्वरित आपातकालीन SOS</h3>
            <p className="text-base text-slate-600 dark:text-slate-400">एक क्लिक में परिजनों या 112 सहायता को कॉल करें।</p>
          </div>
        </Card>
      </div>

      {/* Primary Actions */}
      <div className="w-full space-y-4 pt-2">
        <Link href="/auth/login" className="block w-full">
          <Button variant="primary" size="huge">
            लॉग इन करें (Sign In)
          </Button>
        </Link>

        <Link href="/auth/signup" className="block w-full">
          <Button variant="outline" size="large" className="w-full">
            नया खाता बनाएँ (Sign Up)
          </Button>
        </Link>

        {/* Guest Demo Mode */}
        <button
          onClick={handleStartDemo}
          className="w-full py-4 text-xl font-bold text-brand-800 dark:text-brand-300 underline hover:text-brand-900 focus:ring-2 focus:ring-brand-500 rounded-xl"
        >
          बिना खाते के चलाकर देखें (Try Guest Demo Mode)
        </button>
      </div>

      {/* Safety Notice & Medical Disclaimer */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2.5 text-left">
        <Shield className="w-5 h-5 shrink-0 mt-0.5 text-slate-700 dark:text-slate-300" />
        <p>
          <strong>सुरक्षा सूचना:</strong> {t('app.disclaimer')}
        </p>
      </div>
    </div>
  );
}
