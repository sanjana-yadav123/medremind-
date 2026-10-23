'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/lib/types/database';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [consentGiven, setConsentGiven] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName || !email || !password) {
      setErrorMsg('कृपया सभी अनिवार्य फ़ील्ड भरें।');
      return;
    }

    if (!consentGiven) {
      setErrorMsg('कृपया जारी रखने के लिए गोपनीयता एवं डेटा सहमति स्वीकार करें।');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            role,
            phone_number: phone,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      // If user profile needs to be inserted into public.profiles
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          role,
          display_name: displayName,
          phone_number: phone || null,
          language_pref: 'hi',
          high_contrast_mode: false,
          text_size: 'large',
          timezone: 'Asia/Kolkata',
          emergency_sharing_consent: consentGiven,
        });
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg('साइनअप करने में समस्या आई। कृपया नेटवर्क कनेक्शन जाँचें।');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <Card className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            नया खाता बनाएँ (Sign Up)
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            MedRemind स्वास्थ्य सहायक से जुड़ें
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 rounded-xl border-2 border-red-600 flex items-start gap-2.5">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <span className="text-lg font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="text-xl font-bold text-slate-900 dark:text-slate-100">
              आपकी भूमिका (Your Role):
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-3 px-4 rounded-xl border-2 font-bold text-lg min-h-[52px] ${
                  role === 'patient'
                    ? 'border-brand-700 bg-brand-100 text-brand-900 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                👤 मरीज़ (Patient)
              </button>
              <button
                type="button"
                onClick={() => setRole('caregiver')}
                className={`py-3 px-4 rounded-xl border-2 font-bold text-lg min-h-[52px] ${
                  role === 'caregiver'
                    ? 'border-brand-700 bg-brand-100 text-brand-900 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                🤝 देखभालकर्ता (Caregiver)
              </button>
            </div>
          </div>

          <Input
            label="पूरा नाम (Full Name)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="उदा. रमेश कुमार"
            required
          />

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
            label="मोबाइल नंबर (Phone - Optional)"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
          />

          <Input
            label="पासवर्ड (Password)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="कम से कम 6 अक्षर"
            required
            autoComplete="new-password"
          />

          {/* Privacy Consent Checkbox */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-300 dark:border-slate-700">
            <input
              id="privacy-consent"
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="w-6 h-6 mt-1 rounded border-slate-400 text-brand-700 focus:ring-brand-500 cursor-pointer"
            />
            <label htmlFor="privacy-consent" className="text-base text-slate-700 dark:text-slate-300 cursor-pointer">
              मैं दवा प्रबंधन और अनुस्मारक के उद्देश्य से अपने स्वास्थ्य डेटा के सुरक्षित उपयोग की सहमति देता/देती हूँ।
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="huge"
            disabled={isLoading}
            icon={<UserPlus className="w-6 h-6" />}
          >
            {isLoading ? 'खाता बन रहा है...' : 'खाता बनाएँ (Register)'}
          </Button>
        </form>

        <div className="text-center pt-2">
          <span className="text-slate-600 dark:text-slate-400 text-lg">पहले से खाता है? </span>
          <Link
            href="/auth/login"
            className="text-lg font-black text-brand-700 dark:text-brand-400 hover:underline"
          >
            यहाँ लॉग इन करें
          </Link>
        </div>
      </Card>
    </div>
  );
}
