'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AcceptCaregiverInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccept = async () => {
    if (!token) {
      setErrorMsg('आमंत्रण टोकन उपलब्ध नहीं है।');
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
        throw new Error(data.error || 'आमंत्रण स्वीकार करने में विफल');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि हुई');
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
            देखभालकर्ता आमंत्रण
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            आपको परिवार के सदस्य द्वारा उनकी दवा समय सारणी की निगरानी और सहायता के लिए आमंत्रित किया गया है।
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 text-red-950 rounded-xl border border-red-400 flex items-start gap-2 text-left">
            <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5 text-red-700" />
            <span className="font-bold text-base">{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-6 bg-green-100 dark:bg-green-950 rounded-2xl border-2 border-green-600 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-700 mx-auto" />
            <h3 className="text-2xl font-bold text-green-950 dark:text-green-200">
              आमंत्रण सफलतापूर्वक स्वीकार कर लिया गया!
            </h3>
            <p className="text-base text-green-900 dark:text-green-300">
              अब आप परिवार के सदस्य की स्वीकृत दवा सारणी देख सकते हैं।
            </p>
            <Link href="/dashboard" className="block w-full">
              <Button variant="primary" size="large" className="w-full">
                डैशबोर्ड पर जाएँ (Go to Dashboard)
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-left text-sm text-slate-600 dark:text-slate-400">
              <p className="font-bold text-slate-900 dark:text-white mb-1">
                सुरक्षा एवं गोपनीयता नियम:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>आप केवल मरीज़ द्वारा अनुमत स्वास्थ्य विवरण ही देख सकेंगे।</li>
                <li>मरीज़ किसी भी समय यह अनुमति तुरंत समाप्त कर सकते हैं।</li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="huge"
              disabled={isLoading || !token}
              onClick={handleAccept}
              className="w-full text-2xl shadow-xl"
            >
              {isLoading ? 'सत्यापित हो रहा है...' : 'आमंत्रण स्वीकार करें (Accept)'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
