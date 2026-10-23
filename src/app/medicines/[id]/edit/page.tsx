'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowLeft, Archive, CheckCircle, AlertCircle } from 'lucide-react';
import { MedicineRoute } from '@/lib/types/database';

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [route, setRoute] = useState<MedicineRoute>('oral');
  const [instructions, setInstructions] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing medicine details
    if (id) {
      loadMedicine();
    }
  }, [id]);

  const loadMedicine = async () => {
    try {
      const isDemo = localStorage.getItem('medremind_demo_mode') === 'true';
      if (isDemo) {
        setName('एम्लोडिपिन (Amlodipine)');
        setPrescribedDose('5mg - 1 गोली');
        setRoute('oral');
        setInstructions('सुबह नाश्ते के बाद 1 गोली पानी से (बीपी की दवा)');
        setIsArchived(false);
      } else {
        const res = await fetch(`/api/medicines/${id}`);
        if (res.ok) {
          const data = await res.json();
          const med = data.medicine;
          setName(med.name);
          setPrescribedDose(med.prescribed_dose);
          setRoute(med.route);
          setInstructions(med.instructions);
          setIsArchived(med.is_archived);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          prescribed_dose: prescribedDose,
          route,
          instructions,
          is_archived: isArchived,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'अपडेट करने में समस्या आई');
      }

      router.push('/medicines');
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि हुई');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArchive = () => {
    setIsArchived(!isArchived);
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Link
        href="/medicines"
        className="inline-flex items-center gap-2 text-brand-700 dark:text-brand-400 font-bold text-lg hover:underline"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>दवाइयों की सूची पर वापस जाएँ</span>
      </Link>

      <Card className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {t('medicines.editMedicine')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            दवा का विवरण या डॉक्टर के निर्देश अपडेट करें
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-200 rounded-xl border-2 border-red-600 flex items-start gap-2.5">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <span className="text-lg font-bold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <Input
            label={t('medicines.medicineName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('medicines.prescribedDose')}
              value={prescribedDose}
              onChange={(e) => setPrescribedDose(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('medicines.route')}
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as MedicineRoute)}
                className="min-h-[52px] px-4 py-3 text-xl rounded-xl border-2 border-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="oral">{t('medicines.routeOral')}</option>
                <option value="injection">{t('medicines.routeInjection')}</option>
                <option value="inhalation">{t('medicines.routeInhalation')}</option>
                <option value="topical">{t('medicines.routeTopical')}</option>
                <option value="drops">{t('medicines.routeDrops')}</option>
                <option value="other">अन्य</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('medicines.instructions')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="px-4 py-3 text-xl rounded-xl border-2 border-slate-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              required
            />
          </div>

          {/* Archive Status Toggle */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                दवा की चालू स्थिति (Status)
              </h4>
              <p className="text-base text-slate-600 dark:text-slate-400">
                {isArchived ? 'यह दवा बंद (Archived) है' : 'यह दवा वर्तमान में चालू (Active) है'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleArchive}
              className={`px-4 py-2 rounded-xl font-bold text-lg min-h-[48px] border-2 ${
                isArchived
                  ? 'bg-amber-100 border-amber-600 text-amber-900'
                  : 'bg-green-100 border-green-600 text-green-900'
              }`}
            >
              {isArchived ? 'पुनः चालू करें' : 'आर्काइव / बंद करें'}
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="huge"
              disabled={isLoading}
              className="flex-1"
            >
              बदलाव सुरक्षित करें
            </Button>
            <Link href="/medicines" className="flex-1">
              <Button type="button" variant="secondary" size="huge" className="w-full">
                रद्द करें
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
