'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { PhoneCall, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SosButtonProps {
  primaryPhone?: string;
  primaryContactName?: string;
  caregiverPhone?: string;
  caregiverName?: string;
}

export const SosButton: React.FC<SosButtonProps> = ({
  primaryPhone = '+91112',
  primaryContactName = 'आपातकालीन सेवा (112)',
  caregiverPhone,
  caregiverName,
}) => {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [dialerStatus, setDialerStatus] = useState<string | null>(null);

  const handleLaunchDialer = (phone: string) => {
    try {
      // Validate phone number format
      const cleaned = phone.replace(/[^\d+]/g, '');
      if (!cleaned) {
        setDialerStatus('अमान्य फ़ोन नंबर दर्ज है।');
        return;
      }

      setDialerStatus('फ़ोन डायलर खुल रहा है... कृपया स्क्रीन पर कॉल बटन दबाएँ।');
      window.location.href = `tel:${cleaned}`;
    } catch (err) {
      setDialerStatus('डिवाइस डायलर खोलने में असमर्थ। कृपया मैन्युअल रूप से कॉल करें: ' + phone);
    }
  };

  return (
    <>
      <Button
        variant="danger"
        size="huge"
        icon={<PhoneCall className="w-8 h-8" />}
        onClick={() => setIsConfirmOpen(true)}
        className="text-2xl font-black min-h-[80px] shadow-2xl animate-pulse"
        aria-label="आपातकालीन कॉल बटन (Emergency SOS)"
      >
        {t('emergency.sosButton')}
      </Button>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setDialerStatus(null);
        }}
        title="आपातकालीन सहायता (Emergency Confirmation)"
      >
        <div className="space-y-6 text-center">
          <div className="p-4 bg-red-100 dark:bg-red-950/80 rounded-2xl border-2 border-red-700 flex items-start gap-3 text-left">
            <AlertTriangle className="w-8 h-8 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xl font-bold text-red-950 dark:text-red-200">
                {t('emergency.sosConfirmTitle')}
              </h4>
              <p className="text-base text-red-900 dark:text-red-300 mt-1">
                {t('emergency.sosConfirmDesc')}
              </p>
            </div>
          </div>

          {dialerStatus && (
            <div className="p-3 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 rounded-xl border border-blue-400 text-lg font-bold">
              {dialerStatus}
            </div>
          )}

          <div className="space-y-3">
            {/* Primary Contact Dialer */}
            <Button
              variant="danger"
              size="large"
              className="w-full text-xl"
              icon={<PhoneCall className="w-6 h-6" />}
              onClick={() => handleLaunchDialer(primaryPhone)}
            >
              📞 {primaryContactName} ({primaryPhone})
            </Button>

            {/* Caregiver Dialer (if configured) */}
            {caregiverPhone && (
              <Button
                variant="secondary"
                size="large"
                className="w-full text-xl"
                icon={<UserCheck className="w-6 h-6" />}
                onClick={() => handleLaunchDialer(caregiverPhone)}
              >
                👤 देखभालकर्ता को कॉल: {caregiverName || 'केयरगिवर'} ({caregiverPhone})
              </Button>
            )}

            {/* National 112 Emergency */}
            <Button
              variant="outline"
              size="normal"
              className="w-full text-lg"
              onClick={() => handleLaunchDialer('112')}
            >
              🚨 राष्ट्रीय आपात नंबर (112) डायल करें
            </Button>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('emergency.disclaimer')}
          </p>

          <Button
            variant="outline"
            size="normal"
            className="w-full"
            onClick={() => {
              setIsConfirmOpen(false);
              setDialerStatus(null);
            }}
          >
            {t('emergency.cancel')}
          </Button>
        </div>
      </Modal>
    </>
  );
};
