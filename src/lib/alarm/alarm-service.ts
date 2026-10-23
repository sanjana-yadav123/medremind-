import { WebSpeechService } from '@/lib/speech/speech-service';

export interface ActiveAlarm {
  doseEventId: string;
  medicineName: string;
  dose: string;
  instructions: string;
  scheduledTime: string;
}

type AlarmCallback = (alarm: ActiveAlarm) => void;

/**
 * Real In-Browser Audible & Vibrating Medicine Alarm Service
 * Generates continuous medical alarm siren via Web Audio API without needing external files!
 */
export class AlarmService {
  private static audioCtx: AudioContext | null = null;
  private static alarmInterval: any = null;
  private static vibrationInterval: any = null;
  private static listeners: Set<AlarmCallback> = new Set();
  private static currentActiveAlarm: ActiveAlarm | null = null;
  private static snoozedEvents: Map<string, number> = new Map(); // doseEventId -> snoozeUntilTimestamp
  private static triggeredEventsToday: Set<string> = new Set();

  /**
   * Subscribe to alarm trigger events
   */
  static onAlarm(callback: AlarmCallback): () => void {
    this.listeners.add(callback);
    if (this.currentActiveAlarm) {
      callback(this.currentActiveAlarm);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Start the continuous synthesized medical alarm ringtone
   */
  static startAlarmSound() {
    if (typeof window === 'undefined') return;

    this.stopAlarmSound(); // Clear any existing

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!this.audioCtx || this.audioCtx.state === 'suspended') {
      this.audioCtx = new AudioContextClass();
    }

    const ctx = this.audioCtx;

    const playBeepPair = () => {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // Dual harmonic urgency tone (880 Hz A5 + 659.25 Hz E5)
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now);

        // Pulse volume envelope
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.35);
      } catch {
        // audio policy safe
      }
    };

    // Play double beep immediately
    playBeepPair();
    setTimeout(playBeepPair, 200);

    // Loop double beep every 1.6 seconds
    this.alarmInterval = setInterval(() => {
      playBeepPair();
      setTimeout(playBeepPair, 200);
    }, 1600);

    // Vibration pattern: 400ms on, 200ms off, 400ms on
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
        this.vibrationInterval = setInterval(() => {
          navigator.vibrate([400, 200, 400, 200, 800]);
        }, 2200);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Stop alarm sound and vibration
   */
  static stopAlarmSound() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Trigger an active alarm for a dose
   */
  static triggerAlarm(alarm: ActiveAlarm) {
    this.currentActiveAlarm = alarm;
    this.triggeredEventsToday.add(alarm.doseEventId);
    this.startAlarmSound();

    // Spoken voice alert
    WebSpeechService.speak(`ध्यान दें! दवा का समय हो गया है: ${alarm.medicineName}, खुराक ${alarm.dose}`);

    // Notify UI overlay
    this.listeners.forEach((listener) => listener(alarm));
  }

  /**
   * Dismiss the current alarm (Medicine Taken)
   */
  static dismissAlarm() {
    this.stopAlarmSound();
    WebSpeechService.playChime('success');
    this.currentActiveAlarm = null;
    this.listeners.forEach((listener) => listener(null as any));
  }

  /**
   * Snooze alarm for N minutes (default 10 mins)
   */
  static snoozeAlarm(minutes: number = 10) {
    if (!this.currentActiveAlarm) return;
    const doseId = this.currentActiveAlarm.doseEventId;
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    this.snoozedEvents.set(doseId, snoozeUntil);

    this.stopAlarmSound();
    WebSpeechService.playChime('alert');
    WebSpeechService.speak(`${minutes} मिनट बाद पुनः अलार्म बजेगा।`);

    this.currentActiveAlarm = null;
    this.listeners.forEach((listener) => listener(null as any));
  }

  /**
   * Check if any scheduled medicine or snoozed alarm is due now
   */
  static checkDueAlarms(
    todayDoses: { doseEventId: string; displayTime: string; medicineId: string; status: string }[],
    medicines: { id: string; name: string; prescribed_dose: string; instructions: string }[]
  ) {
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const nowEpoch = now.getTime();

    for (const dose of todayDoses) {
      if (dose.status !== 'scheduled') continue;

      // Check snoozed alarms
      const snoozeUntil = this.snoozedEvents.get(dose.doseEventId);
      if (snoozeUntil && nowEpoch >= snoozeUntil) {
        this.snoozedEvents.delete(dose.doseEventId);
        const med = medicines.find((m) => m.id === dose.medicineId);
        if (med) {
          this.triggerAlarm({
            doseEventId: dose.doseEventId,
            medicineName: med.name,
            dose: med.prescribed_dose,
            instructions: med.instructions,
            scheduledTime: dose.displayTime,
          });
          return;
        }
      }

      // Check regular scheduled time
      if (dose.displayTime === currentTimeStr && !this.triggeredEventsToday.has(dose.doseEventId)) {
        const med = medicines.find((m) => m.id === dose.medicineId);
        if (med) {
          this.triggerAlarm({
            doseEventId: dose.doseEventId,
            medicineName: med.name,
            dose: med.prescribed_dose,
            instructions: med.instructions,
            scheduledTime: dose.displayTime,
          });
          return;
        }
      }
    }
  }

  /**
   * Test the alarm sound right now for user inspection
   */
  static testAlarmNow() {
    this.triggerAlarm({
      doseEventId: `test_alarm_${Date.now()}`,
      medicineName: 'एम्लोडिपिन (Amlodipine 5mg)',
      dose: '1 गोली (Tablet)',
      instructions: 'परीक्षण अलार्म: पानी के साथ लें',
      scheduledTime: 'अभी (Now)',
    });
  }
}
