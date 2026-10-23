'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Users, UserPlus, Shield, Trash2, CheckCircle2, Copy } from 'lucide-react';
import { LocalDatabase } from '@/lib/offline/local-database';

export default function CaregiversPage() {
  const { t } = useTranslation();
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [canView, setCanView] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [canAlerts, setCanAlerts] = useState(true);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadCaregivers();
  }, []);

  const loadCaregivers = () => {
    const list = LocalDatabase.getCaregivers();
    setCaregivers(list);
  };

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const result = LocalDatabase.addCaregiver(name, phone, {
      can_view_medicines: canView,
      can_edit_schedules: canEdit,
      can_receive_missed_dose_alerts: canAlerts,
    });

    setGeneratedInviteLink(result.inviteUrl);
    loadCaregivers();
  };

  const handleCopyLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleRevoke = (id: string) => {
    if (!window.confirm(t('caregivers.revokeConfirm'))) return;

    LocalDatabase.revokeCaregiver(id);
    loadCaregivers();
    setNotice('देखभालकर्ता की अनुमति तत्काल समाप्त कर दी गई है।');
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Users className="w-7 h-7" />
            </div>
            <span>{t('caregivers.title')}</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-1">
            {t('caregivers.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="large"
          icon={<UserPlus className="w-6 h-6" />}
          onClick={() => {
            setGeneratedInviteLink(null);
            setIsInviteModalOpen(true);
          }}
          className="text-xl shadow-md rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600"
        >
          {t('caregivers.inviteNew')}
        </Button>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-600 rounded-3xl text-emerald-950 dark:text-emerald-200 text-lg font-bold flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Security notice */}
      <div className="p-4 bg-blue-50/90 dark:bg-blue-950/40 rounded-2xl border-2 border-blue-400 text-blue-950 dark:text-blue-200 flex items-start gap-3 shadow-xs">
        <Shield className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
        <p className="text-base font-bold">
          गोपनीयता सुरक्षा: देखभालकर्ता केवल वही जानकारी देख सकते हैं जिसकी आपने स्पष्ट अनुमति दी है। आप किसी भी समय अनुमति को तुरंत समाप्त कर सकते हैं।
        </p>
      </div>

      {/* Caregiver list */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {t('caregivers.activeCaregivers')}:
        </h2>

        {caregivers.length > 0 ? (
          caregivers.map((cg) => (
            <Card key={cg.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {cg.caregiver_name}
                  </h3>
                  <span className="text-sm font-bold bg-emerald-100 text-emerald-950 px-3 py-1 rounded-full border border-emerald-600">
                    {cg.invitation_status === 'accepted' ? 'सक्रिय (Active)' : 'प्रतीक्षारत (Pending)'}
                  </span>
                </div>
                {cg.caregiver_phone && (
                  <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                    फ़ोन: {cg.caregiver_phone}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {cg.permissions.can_view_medicines && (
                    <span className="bg-emerald-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-emerald-200">
                      ✓ {t('caregivers.permView')}
                    </span>
                  )}
                  {cg.permissions.can_edit_schedules && (
                    <span className="bg-emerald-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-emerald-200">
                      ✓ {t('caregivers.permEdit')}
                    </span>
                  )}
                  {cg.permissions.can_receive_missed_dose_alerts && (
                    <span className="bg-emerald-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-emerald-200">
                      ✓ {t('caregivers.permAlerts')}
                    </span>
                  )}
                </div>
              </div>

              <Button
                variant="danger"
                size="normal"
                icon={<Trash2 className="w-5 h-5" />}
                onClick={() => handleRevoke(cg.id)}
                className="self-end sm:self-auto text-base rounded-xl"
              >
                {t('caregivers.revokeAccess')}
              </Button>
            </Card>
          ))
        ) : (
          <Card className="glass-card text-center py-8 text-slate-500 text-xl font-bold rounded-3xl">
            कोई देखभालकर्ता अभी तक नहीं जुड़ा है।
          </Card>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title={t('caregivers.inviteNew')}
      >
        {generatedInviteLink ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              सुरक्षित आमंत्रण लिंक तैयार है!
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-400">
              {t('caregivers.invitationExpiryNotice')}
            </p>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 font-mono text-sm break-all text-left">
              {generatedInviteLink}
            </div>
            <Button
              variant="primary"
              size="large"
              icon={<Copy className="w-6 h-6" />}
              onClick={handleCopyLink}
              className="w-full text-xl rounded-2xl"
            >
              {copySuccess ? t('caregivers.copied') : t('caregivers.copyLink')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <Input
              label={t('caregivers.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="जैसे: अमित शर्मा"
              required
            />

            <Input
              label={t('caregivers.phone')}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
            />

            <div className="space-y-2 pt-2">
              <label className="text-lg font-bold text-slate-900 dark:text-slate-100 block">
                {t('caregivers.permissions')}:
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canView}
                  onChange={(e) => setCanView(e.target.checked)}
                  className="w-6 h-6 text-emerald-700 rounded-lg"
                />
                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {t('caregivers.permView')}
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEdit}
                  onChange={(e) => setCanEdit(e.target.checked)}
                  className="w-6 h-6 text-emerald-700 rounded-lg"
                />
                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {t('caregivers.permEdit')}
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canAlerts}
                  onChange={(e) => setCanAlerts(e.target.checked)}
                  className="w-6 h-6 text-emerald-700 rounded-lg"
                />
                <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {t('caregivers.permAlerts')}
                </span>
              </label>
            </div>

            <Button type="submit" variant="primary" size="huge" className="w-full rounded-2xl">
              {t('caregivers.generateLink')}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
