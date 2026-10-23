'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

function AcceptCaregiverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccept = async () => {
    if (!token) {
      setErrorMsg('Token missing');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/caregivers/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center p-8 space-y-6">
        <div className="w-20 h-20 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-3xl flex items-center justify-center mx-auto">
          <Users className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {t('caregivers.title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {t('caregivers.subtitle')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-900 rounded-2xl flex items-center gap-2 text-left">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-100 text-emerald-950 rounded-2xl flex items-center gap-2 text-left">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-700" />
              <span className="font-bold">
                {t('dashboard.confirmSuccess')}
              </span>
            </div>
            <Link href="/dashboard">
              <Button variant="primary" size="large" className="w-full text-xl" icon={<ArrowRight className="w-6 h-6" />}>
                {t('nav.dashboard')}
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            variant="primary"
            size="huge"
            onClick={handleAccept}
            disabled={isLoading || !token}
            className="w-full text-xl shadow-xl"
          >
            {isLoading ? '...' : t('caregivers.inviteNew')}
          </Button>
        )}
      </Card>
    </div>
  );
}

export default function AcceptCaregiverInvitePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 font-bold text-xl">Loading...</div>}>
      <AcceptCaregiverContent />
    </Suspense>
  );
}
