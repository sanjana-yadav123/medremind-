'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('कृपया ईमेल और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide friendly Hindi feedback
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('अमान्य ईमेल या पासवर्ड। कृपया जाँच कर पुनः प्रयास करें।');
        } else {
          setErrorMsg(error.message);
        }
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg('लॉगिन करने में समस्या आई। कृपया नेटवर्क कनेक्शन जाँचें।');
      setIsLoading(false);
    }
  };

  const handleQuickDemo = () => {
    localStorage.setItem('medremind_demo_mode', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            लॉग इन करें (Sign In)
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            अपने MedRemind खाते में प्रवेश करें
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 rounded-xl border-2 border-red-600 flex items-start gap-2.5">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <span className="text-lg font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="ईमेल पता (Email)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="apna-email@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="पासवर्ड (Password)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-lg font-bold text-brand-700 dark:text-brand-400 hover:underline"
            >
              पासवर्ड भूल गए? (Forgot password)
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="huge"
            disabled={isLoading}
            icon={<LogIn className="w-6 h-6" />}
          >
            {isLoading ? 'जाँच हो रही है...' : 'लॉग इन करें'}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-slate-900 text-slate-500 font-bold">या</span>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="large"
          className="w-full"
          onClick={handleQuickDemo}
        >
          डेमो मोड में तुरंत शुरू करें (Guest Demo)
        </Button>

        <div className="text-center pt-2">
          <span className="text-slate-600 dark:text-slate-400 text-lg">नया खाता बनाना चाहते हैं? </span>
          <Link
            href="/auth/signup"
            className="text-lg font-black text-brand-700 dark:text-brand-400 hover:underline"
          >
            यहाँ साइन अप करें
          </Link>
        </div>
      </Card>
    </div>
  );
}
