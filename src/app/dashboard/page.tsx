'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { VoiceAssistantModal } from '@/components/voice/VoiceAssistantModal';
import { SosButton } from '@/components/emergency/SosButton';
import { LifespanStageSelector } from '@/components/lifespan/LifespanStageSelector';
import {
  Check,
  Clock,
  AlertTriangle,
  Mic,
  Pill,
  Users,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  BellRing,
  Volume2,
} from 'lucide-react';
import { Medicine, MedicationSchedule, LifespanStage, DoseEvent } from '@/lib/types/database';
import { calculateOccurrencesForDate, ScheduleOccurrence, getPatientLocalDateString } from '@/lib/dates/schedule-calculator';
import { LocalDatabase } from '@/lib/offline/local-database';
import { AlarmService } from '@/lib/alarm/alarm-service';
import { WebSpeechService } from '@/lib/speech/speech-service';

export default function DashboardPage() {
  const { t, locale, currentLanguage } = useTranslation();
  const [lifespanStage, setLifespanStage] = useState<LifespanStage>('senior');
  const [userName, setUserName] = useState('रामेश्वर जी');
  const [greeting, setGreeting] = useState('');
  const [todayFormatted, setTodayFormatted] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Medicines and schedules state
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [todayDoses, setTodayDoses] = useState<ScheduleOccurrence[]>([]);
  const [prnMedicines, setPrnMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    // 1. Initialize local database
    LocalDatabase.init();
    const profile = LocalDatabase.getProfile();
    setLifespanStage(profile.lifespan_stage || 'senior');
    setUserName(profile.display_name || 'रामेश्वर जी');

    // 2. Greeting & Date
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('dashboard.greetingMorning'));
    else if (hour < 17) setGreeting(t('dashboard.greetingAfternoon'));
    else if (hour < 21) setGreeting(t('dashboard.greetingEvening'));
    else setGreeting(t('dashboard.greetingNight'));

    const now = new Date();
    try {
      setTodayFormatted(
        now.toLocaleDateString(currentLanguage.voiceLang, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    } catch {
      setTodayFormatted(now.toDateString());
    }

    loadData(profile.lifespan_stage || 'senior');

    // Listen for custom dose updates
    const handleDoseUpdated = () => loadData();
    window.addEventListener('medremind_dose_updated', handleDoseUpdated);

    return () => {
      window.removeEventListener('medremind_dose_updated', handleDoseUpdated);
    };
  }, [locale]);

  // Real-time alarm ticker: checks due dose times every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (todayDoses.length > 0 && medicines.length > 0) {
        AlarmService.checkDueAlarms(todayDoses, medicines);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [todayDoses, medicines]);

  const loadData = (stage: LifespanStage = lifespanStage) => {
    const todayDateStr = getPatientLocalDateString(new Date(), 'Asia/Kolkata');

    // Load from self-contained local database
    const allMeds = LocalDatabase.getMedicines();
    // Filter medicines relevant to selected lifespan stage or universal
    const stageMeds = allMeds.filter((m) => !m.is_archived && (!m.lifespan_target || m.lifespan_target === stage));

    const allSchedules = LocalDatabase.getSchedules();
    const recordedEvents = LocalDatabase.getDoseEvents();

    setMedicines(stageMeds);
    setSchedules(allSchedules);
    setPrnMedicines(stageMeds.filter((m) => m.is_prn));

    // Calculate occurrences
    let occurrences: ScheduleOccurrence[] = [];
    for (const s of allSchedules) {
      // only include if medicine is in stage
      if (stageMeds.some((m) => m.id === s.medicine_id)) {
        const occs = calculateOccurrencesForDate(s, todayDateStr, 'Asia/Kolkata', recordedEvents);
        occurrences = [...occurrences, ...occs];
      }
    }
    setTodayDoses(occurrences.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()));
  };

  const handleStageChange = (newStage: LifespanStage) => {
    setLifespanStage(newStage);
    loadData(newStage);
  };

  const nextDose = todayDoses.find((d) => d.status === 'scheduled');
  const nextMedicine = nextDose ? medicines.find((m) => m.id === nextDose.medicineId) : null;

  const handleAction = (doseEventId: string, actionType: 'take' | 'snooze' | 'miss') => {
    if (actionType === 'take') {
      WebSpeechService.playChime('success');
      setNotificationBanner(t('dashboard.confirmSuccess'));
    } else if (actionType === 'snooze') {
      WebSpeechService.playChime('alert');
      setNotificationBanner(t('dashboard.snoozeSuccess'));
    } else {
      setNotificationBanner(t('dashboard.missSuccess'));
    }

    setTimeout(() => setNotificationBanner(null), 5000);

    // Save directly in Local Database
    LocalDatabase.recordDoseAction(
      doseEventId,
      actionType,
      nextDose?.medicineId || 'med',
      new Date().toISOString(),
      actionType === 'take' ? t('dashboard.actionTakenNote') : t('dashboard.actionMissedNote')
    );

    loadData();
  };

  const handleTestAlarm = () => {
    AlarmService.testAlarmNow();
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {notificationBanner && (
        <div
          role="alert"
          className="p-4 bg-emerald-100/90 dark:bg-emerald-950 border-2 border-emerald-600 rounded-3xl text-emerald-950 dark:text-emerald-100 text-xl font-bold flex items-center gap-3 shadow-md animate-in fade-in"
        >
          <Sparkles className="w-7 h-7 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* Greeting and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, {userName}!
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1 font-semibold">
            <Calendar className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <span>{todayFormatted}</span>
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Test Alarm Sound Button */}
          <button
            onClick={handleTestAlarm}
            className="px-3.5 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 text-white font-extrabold text-base rounded-2xl flex items-center gap-2 shadow-sm hover:scale-105 transition-all"
            title={t('dashboard.alarmTest')}
          >
            <BellRing className="w-5 h-5 animate-bounce" />
            <span>{t('dashboard.alarmTest')}</span>
          </button>

          {/* Voice Assistant Button */}
          <Button
            variant="secondary"
            size="large"
            icon={<Mic className="w-6 h-6 text-emerald-700 dark:text-emerald-400 animate-pulse" />}
            onClick={() => setIsVoiceModalOpen(true)}
            className="text-lg border-2 border-emerald-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm rounded-2xl hover:bg-emerald-50"
          >
            {t('dashboard.voiceButton')}
          </Button>
        </div>
      </div>

      {/* LIFESPAN STAGE SELECTOR (1 Day to 100+ Years) */}
      <Card className="glass-card p-4 rounded-3xl">
        <LifespanStageSelector currentStage={lifespanStage} onStageChange={handleStageChange} />
      </Card>

      {/* HERO NEXT SCHEDULED MEDICINE CARD */}
      <section aria-labelledby="next-dose-heading">
        <h2 id="next-dose-heading" className="text-2xl font-black text-emerald-950 dark:text-emerald-300 mb-3 flex items-center gap-2">
          <Clock className="w-7 h-7 text-emerald-700 dark:text-emerald-400" />
          <span>{t('dashboard.nextDose')}</span>
        </h2>

        {nextDose && nextMedicine ? (
          <div className="hero-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-block text-lg font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-200/80 dark:bg-emerald-900/80 px-3.5 py-1.5 rounded-xl shadow-xs">
                  {t('dashboard.scheduledAt')}: {nextDose.displayTime}
                </span>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white">
                  {nextMedicine.name}
                </h3>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {t('dashboard.doseAmount')}: {nextMedicine.prescribed_dose} • {nextMedicine.route === 'drops' ? t('dashboard.drops') : nextMedicine.route === 'syrup' ? t('dashboard.syrup') : t('dashboard.tablet')}
                </p>
              </div>

              <div className="shrink-0">
                <Badge status={nextDose.status} />
              </div>
            </div>

            {/* Doctor's instructions */}
            <div className="p-4 bg-white/90 dark:bg-slate-900/90 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 flex items-start gap-3 shadow-xs">
              <Info className="w-6 h-6 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {nextMedicine.instructions}
              </p>
            </div>

            {/* THREE LARGE ACTION BUTTONS (Touch height >= 64px) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Button
                variant="primary"
                size="large"
                icon={<Check className="w-7 h-7" />}
                onClick={() => handleAction(nextDose.doseEventId, 'take')}
                className="text-xl sm:text-2xl shadow-lg rounded-2xl bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-800 hover:to-green-700"
              >
                {t('dashboard.takeDose')}
              </Button>

              <Button
                variant="warning"
                size="large"
                icon={<Clock className="w-6 h-6" />}
                onClick={() => handleAction(nextDose.doseEventId, 'snooze')}
                className="text-xl rounded-2xl shadow-sm"
              >
                {t('dashboard.snoozeDose')}
              </Button>

              <Button
                variant="outline"
                size="large"
                icon={<AlertTriangle className="w-6 h-6 text-amber-700" />}
                onClick={() => handleAction(nextDose.doseEventId, 'miss')}
                className="text-lg text-amber-900 border-amber-500 rounded-2xl shadow-xs"
              >
                {t('dashboard.missDose')}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="glass-card text-center py-10 space-y-3 rounded-3xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✓
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {t('dashboard.noNextDose')}
            </h3>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              इस आयु वर्ग के लिए आज की सभी दवाइयाँ पूरी हो चुकी हैं।
            </p>
          </Card>
        )}
      </section>

      {/* TODAY'S TIMELINE */}
      <section aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          {t('dashboard.timelineTitle')}
        </h2>

        <div className="space-y-3">
          {todayDoses.length > 0 ? (
            todayDoses.map((dose) => {
              const med = medicines.find((m) => m.id === dose.medicineId);
              if (!med) return null;

              return (
                <Card key={dose.doseEventId} className="glass-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl">
                  <div className="flex items-center gap-4">
                    <div className="text-center px-3.5 py-2.5 bg-emerald-100/80 dark:bg-emerald-950/80 rounded-2xl border border-emerald-300 dark:border-emerald-800 min-w-[80px]">
                      <span className="block text-xl font-black text-emerald-900 dark:text-emerald-300">
                        {dose.displayTime}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {med.name}
                      </h4>
                      <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
                        {med.prescribed_dose} • {med.instructions}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <Badge status={dose.status} />
                    {dose.status === 'scheduled' && (
                      <Button
                        variant="primary"
                        size="normal"
                        onClick={() => handleAction(dose.doseEventId, 'take')}
                        className="rounded-xl shadow-xs"
                        aria-label={`${med.name} ${t('dashboard.takeDose')}`}
                      >
                        {t('dashboard.takeDose')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="glass-card text-center py-6 text-slate-500 rounded-3xl">
              आज के लिए कोई निर्धारित समय सारणी उपलब्ध नहीं है।
            </Card>
          )}
        </div>
      </section>

      {/* AS-NEEDED PRN MEDICINES */}
      {prnMedicines.length > 0 && (
        <section aria-labelledby="prn-heading">
          <h2 id="prn-heading" className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            {t('dashboard.asNeededTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {prnMedicines.map((med) => (
              <Card key={med.id} className="glass-card p-4 flex items-center justify-between border-2 border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold">
                    PRN
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{med.name}</h4>
                    <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{med.prescribed_dose}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 rounded-lg">
                  ज़रूरत पर
                </span>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* QUICK CAREGIVER & EMERGENCY SOS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="glass-card flex items-center justify-between p-5 rounded-3xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-300">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('dashboard.caregiverStatus')}
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
                अमित शर्मा (पुत्र) सक्रिय जुड़े हैं
              </p>
            </div>
          </div>
          <Link href="/caregivers" className="p-2 rounded-xl text-slate-600 hover:text-slate-900 focus:ring-2 focus:ring-brand-500">
            <ChevronRight className="w-7 h-7" />
          </Link>
        </Card>

        <div className="flex flex-col justify-center">
          <SosButton
            primaryContactName="अमित शर्मा (पुत्र)"
            primaryPhone="+919876501234"
            caregiverName="डॉ. राजेश वर्मा"
            caregiverPhone="+919811122233"
          />
        </div>
      </section>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        nextMedicineName={nextMedicine?.name}
        nextMedicineTime={nextDose?.displayTime}
        onConfirmDose={() => {
          if (nextDose) {
            handleAction(nextDose.doseEventId, 'take');
          }
        }}
      />
    </div>
  );
}
