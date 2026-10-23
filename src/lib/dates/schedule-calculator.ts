import { MedicationSchedule, DoseEvent, Medicine } from '@/lib/types/database';
import { generateDeterministicDoseId } from '@/lib/validation/dose';

export interface ScheduleOccurrence {
  doseEventId: string;
  scheduleId: string;
  medicineId: string;
  patientId: string;
  scheduledTime: Date; // In UTC
  scheduledTimeIso: string;
  displayTime: string; // "08:00"
  status: 'scheduled' | 'taken' | 'skipped' | 'missed' | 'pending_confirmation';
}

/**
 * Calculates scheduled dose occurrences for a given schedule on a target calendar date (in patient's timezone).
 * 
 * @param schedule The active medication schedule
 * @param targetDateStr YYYY-MM-DD representing the date in the patient's local timezone
 * @param patientTimezone Timezone string, default "Asia/Kolkata"
 * @param existingEvents Optional map or array of already recorded dose_events in the database
 */
export function calculateOccurrencesForDate(
  schedule: MedicationSchedule,
  targetDateStr: string,
  patientTimezone: string = 'Asia/Kolkata',
  existingEvents: DoseEvent[] = []
): ScheduleOccurrence[] {
  if (!schedule.is_active || schedule.schedule_type === 'as_needed') {
    return [];
  }

  // Check start_date and end_date bounds
  if (targetDateStr < schedule.start_date) {
    return [];
  }
  if (schedule.end_date && targetDateStr > schedule.end_date) {
    return [];
  }

  // Parse target date components
  const [yearStr, monthStr, dayStr] = targetDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);
  const targetDateObj = new Date(Date.UTC(year, month, day));

  // 1. Day of week check (0 = Sunday, 1 = Monday, ...)
  const dayOfWeek = targetDateObj.getUTCDay();
  if (schedule.schedule_type === 'weekday_selected') {
    if (!schedule.days_of_week.includes(dayOfWeek)) {
      return [];
    }
  }

  // 2. Interval days check (e.g. every 2 days)
  if (schedule.schedule_type === 'interval_days' && schedule.interval_days && schedule.interval_days > 1) {
    const [startYear, startMonth, startDay] = schedule.start_date.split('-').map(Number);
    const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const diffTime = targetDateObj.getTime() - startDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays % schedule.interval_days !== 0) {
      return [];
    }
  }

  const occurrences: ScheduleOccurrence[] = [];

  for (const timeStr of schedule.times_of_day) {
    const [hourStr, minStr] = timeStr.split(':');
    const hours = parseInt(hourStr, 10);
    const minutes = parseInt(minStr, 10);

    // Convert local time in timezone (e.g. Asia/Kolkata +05:30) to UTC Date
    // Note: Asia/Kolkata is fixed UTC+05:30 without daylight savings.
    // For universal DST support, we compute timezone offset.
    const isoStringLocal = `${targetDateStr}T${hourStr.padStart(2, '0')}:${minStr.padStart(2, '0')}:00`;
    
    // Create Date in UTC matching patient's intended reminder moment
    // For Asia/Kolkata (+5:30): UTC time = Local time - 5 hours 30 mins
    let utcMillis: number;
    if (patientTimezone === 'Asia/Kolkata') {
      const localEpoch = Date.UTC(year, month, day, hours, minutes, 0);
      utcMillis = localEpoch - (5 * 60 + 30) * 60 * 1000;
    } else {
      // General fallback using Date parser
      const d = new Date(isoStringLocal);
      utcMillis = d.getTime();
    }

    const scheduledDate = new Date(utcMillis);
    const scheduledTimeIso = scheduledDate.toISOString();
    const doseEventId = generateDeterministicDoseId(schedule.patient_id, schedule.id, scheduledTimeIso);

    // Check if an event already exists in DB
    const existing = existingEvents.find((e) => e.id === doseEventId);

    occurrences.push({
      doseEventId,
      scheduleId: schedule.id,
      medicineId: schedule.medicine_id,
      patientId: schedule.patient_id,
      scheduledTime: scheduledDate,
      scheduledTimeIso,
      displayTime: timeStr,
      status: existing ? existing.status : 'scheduled',
    });
  }

  // Sort by time ascending
  return occurrences.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
}

/**
 * Formats a Date object to patient's local date string YYYY-MM-DD
 */
export function getPatientLocalDateString(date: Date = new Date(), timezone: string = 'Asia/Kolkata'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs "YYYY-MM-DD"
}
