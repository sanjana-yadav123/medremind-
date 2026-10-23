'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('कृपया अपना ईमेल दर्ज करें।');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setErrorMsg('पासवर्ड रीसेट लिंक भेजने में समस्या आई।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="space-y-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-brand-700 dark:text-brand-400 font-bold text-lg hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>लॉगिन पर वापस जाएँ</span>
        </Link>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            पासवर्ड रीसेट (Password Reset)
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            अपना पंजीकृत ईमेल दर्ज करें
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 bg-green-100 dark:bg-green-950/80 rounded-2xl border-2 border-green-600 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-700 dark:text-green-400 mx-auto" />
            <h3 className="text-2xl font-bold text-green-900 dark:text-green-200">
              रीसेट लिंक भेज दिया गया है!
            </h3>
            <p className="text-lg text-green-800 dark:text-green-300">
              कृपया अपना ईमेल इनबॉक्स देखें और दिए गए लिंक पर क्लिक करके नया पासवर्ड सेट करें।
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-4 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 rounded-xl border-2 border-red-600 flex items-start gap-2.5">
                <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                <span className="text-lg font-bold">{errorMsg}</span>
              </div>
            )}

            <Input
              label="ईमेल पता (Email)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="apna-email@example.com"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="huge"
              disabled={isLoading}
            >
              {isLoading ? 'भेजा जा रहा है...' : 'रीसेट लिंक भेजें'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
