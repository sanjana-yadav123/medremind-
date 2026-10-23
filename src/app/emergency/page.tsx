'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SosButton } from '@/components/emergency/SosButton';
import { PhoneCall, Plus, ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EmergencyContact } from '@/lib/types/database';
import { LocalDatabase } from '@/lib/offline/local-database';

export default function EmergencyPage() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [consentGranted, setConsentGranted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = () => {
    const list = LocalDatabase.getEmergencyContacts();
    setContacts(list);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !phone || !relationship) {
      setErrorMsg('कृपया सभी फ़ील्ड भरें।');
      return;
    }

    if (!consentGranted) {
      setErrorMsg('आपातकालीन संपर्क जोड़ने के लिए सहमति देना अनिवार्य है।');
      return;
    }

    LocalDatabase.addEmergencyContact({
      patient_id: 'local_user',
      contact_name: name,
      relationship,
      phone_number: phone,
      is_primary: isPrimary,
      consent_granted_at: new Date().toISOString(),
    });

    loadContacts();
    setIsAddModalOpen(false);
    setName('');
    setPhone('');
    setRelationship('');
    setConsentGranted(false);
    setSuccessNotice('आपातकालीन संपर्क सुरक्षित हो गया।');
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  const primaryContact = contacts.find((c) => c.is_primary) || contacts[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md">
              <PhoneCall className="w-7 h-7" />
            </div>
            <span>{t('emergency.title')}</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">
            {t('emergency.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="large"
          icon={<Plus className="w-6 h-6" />}
          onClick={() => setIsAddModalOpen(true)}
          className="text-xl shadow-md rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600"
        >
          {t('emergency.addContact')}
        </Button>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 rounded-3xl text-emerald-950 dark:text-emerald-200 text-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* BIG PROMINENT SOS CARD */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-red-50 to-rose-100/70 dark:from-red-950/60 dark:to-rose-950/40 border-4 border-red-600 text-center space-y-4 rounded-3xl shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-black text-red-950 dark:text-red-200">
          तत्काल आपातकालीन सहायता (Emergency SOS)
        </h2>
        <p className="text-xl text-red-900 dark:text-red-300 max-w-lg mx-auto font-medium">
          संकट के समय तुरंत अपने मुख्य संपर्क ({primaryContact ? primaryContact.contact_name : '112'}) को डायल करें।
        </p>

        <div className="max-w-md mx-auto pt-2">
          <SosButton
            primaryContactName={primaryContact?.contact_name || 'राष्ट्रीय आपात नंबर (112)'}
            primaryPhone={primaryContact?.phone_number || '112'}
          />
        </div>
      </Card>

      {/* Safety Legal Disclaimer */}
      <div className="p-4 bg-white/90 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 flex items-start gap-3 shadow-xs">
        <ShieldAlert className="w-7 h-7 text-red-600 shrink-0 mt-0.5" />
        <p className="text-base font-bold text-slate-700 dark:text-slate-300">
          {t('emergency.disclaimer')}
        </p>
      </div>

      {/* Contacts List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
          सहेजे गए आपातकालीन संपर्क:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <Card key={c.id} className="glass-card p-5 flex flex-col justify-between gap-4 rounded-3xl">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {c.contact_name}
                  </h4>
                  {c.is_primary && (
                    <span className="text-xs font-bold bg-red-100 text-red-950 px-2.5 py-1 rounded-full border border-red-500">
                      मुख्य संपर्क (Primary)
                    </span>
                  )}
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  संबंध: {c.relationship}
                </p>
                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                  {c.phone_number}
                </p>
              </div>

              <a
                href={`tel:${c.phone_number.replace(/[^\d+]/g, '')}`}
                className="w-full"
              >
                <Button variant="danger" size="large" className="w-full text-xl rounded-2xl shadow-sm" icon={<PhoneCall className="w-6 h-6" />}>
                  {t('emergency.callNow')} ({c.contact_name})
                </Button>
              </a>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('emergency.addContact')}
      >
        <form onSubmit={handleAddContact} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-100 text-red-900 rounded-xl font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Input
            label={t('emergency.contactName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amit Sharma"
            required
          />

          <Input
            label={t('emergency.relationship')}
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. Son, Daughter, Doctor"
            required
          />

          <Input
            label={t('emergency.phoneNumber')}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            required
          />

          <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-6 h-6 text-emerald-700 rounded-lg"
            />
            <span className="text-lg font-bold">{t('emergency.primaryContact')}</span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="w-6 h-6 mt-1 text-emerald-700 rounded-lg"
              required
            />
            <span className="text-base font-bold text-slate-700 dark:text-slate-300">
              {t('emergency.consent')}
            </span>
          </label>

          <Button type="submit" variant="primary" size="huge" className="w-full rounded-2xl">
            {t('medicines.save')}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
