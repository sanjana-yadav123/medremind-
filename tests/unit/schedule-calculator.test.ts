import { describe, it, expect } from 'vitest';
import { calculateOccurrencesForDate, getPatientLocalDateString } from '@/lib/dates/schedule-calculator';
import { MedicationSchedule } from '@/lib/types/database';

describe('Timezone-Safe Medication Schedule Calculator', () => {
  const baseSchedule: MedicationSchedule = {
    id: 'sched-101',
    medicine_id: 'med-202',
    patient_id: 'patient-303',
    schedule_type: 'once_daily',
    times_of_day: ['08:00'],
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    is_active: true,
    deduplication_hash: 'dedup_hash_test_1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it('should generate occurrence for once_daily schedule within date boundaries', () => {
    const occurrences = calculateOccurrencesForDate(baseSchedule, '2026-10-23', 'Asia/Kolkata');
    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].displayTime).toBe('08:00');
    expect(occurrences[0].doseEventId).toContain('dose_patient-');
    expect(occurrences[0].status).toBe('scheduled');
  });

  it('should generate multiple occurrences for multiple_daily schedule', () => {
    const multiSchedule: MedicationSchedule = {
      ...baseSchedule,
      schedule_type: 'multiple_daily',
      times_of_day: ['08:00', '14:00', '20:30'],
    };

    const occurrences = calculateOccurrencesForDate(multiSchedule, '2026-10-23', 'Asia/Kolkata');
    expect(occurrences).toHaveLength(3);
    expect(occurrences.map((o) => o.displayTime)).toEqual(['08:00', '14:00', '20:30']);
  });

  it('should respect selected weekdays (e.g. Mon, Wed, Fri only)', () => {
    // 2026-10-23 is a Friday (day 5 of week)
    // 2026-10-24 is a Saturday (day 6 of week)
    const weekdaySchedule: MedicationSchedule = {
      ...baseSchedule,
      schedule_type: 'weekday_selected',
      days_of_week: [1, 3, 5], // Mon, Wed, Fri
    };

    const fridayOccurrences = calculateOccurrencesForDate(weekdaySchedule, '2026-10-23', 'Asia/Kolkata');
    expect(fridayOccurrences).toHaveLength(1);

    const saturdayOccurrences = calculateOccurrencesForDate(weekdaySchedule, '2026-10-24', 'Asia/Kolkata');
    expect(saturdayOccurrences).toHaveLength(0);
  });

  it('should respect start_date boundary (no occurrences before start)', () => {
    const futureSchedule: MedicationSchedule = {
      ...baseSchedule,
      start_date: '2026-11-01',
    };

    const occurrences = calculateOccurrencesForDate(futureSchedule, '2026-10-23', 'Asia/Kolkata');
    expect(occurrences).toHaveLength(0);
  });

  it('should respect end_date boundary (no occurrences after end)', () => {
    const pastSchedule: MedicationSchedule = {
      ...baseSchedule,
      end_date: '2026-10-20',
    };

    const occurrences = calculateOccurrencesForDate(pastSchedule, '2026-10-23', 'Asia/Kolkata');
    expect(occurrences).toHaveLength(0);
  });

  it('should produce 0 scheduled occurrences for as_needed (PRN) medicines', () => {
    const prnSchedule: MedicationSchedule = {
      ...baseSchedule,
      schedule_type: 'as_needed',
      times_of_day: [],
    };

    const occurrences = calculateOccurrencesForDate(prnSchedule, '2026-10-23', 'Asia/Kolkata');
    expect(occurrences).toHaveLength(0);
  });

  it('should calculate interval_days schedules properly (e.g. alternate days)', () => {
    const alternateSchedule: MedicationSchedule = {
      ...baseSchedule,
      schedule_type: 'interval_days',
      interval_days: 2,
      start_date: '2026-10-01', // Day 0
    };

    // 2026-10-01 (0 days diff -> match)
    expect(calculateOccurrencesForDate(alternateSchedule, '2026-10-01', 'Asia/Kolkata')).toHaveLength(1);

    // 2026-10-02 (1 day diff -> 1 % 2 !== 0 -> no match)
    expect(calculateOccurrencesForDate(alternateSchedule, '2026-10-02', 'Asia/Kolkata')).toHaveLength(0);

    // 2026-10-03 (2 days diff -> 2 % 2 === 0 -> match)
    expect(calculateOccurrencesForDate(alternateSchedule, '2026-10-03', 'Asia/Kolkata')).toHaveLength(1);
  });

  it('should format patient local date string accurately', () => {
    const sampleDate = new Date('2026-10-23T12:00:00Z');
    const dateStr = getPatientLocalDateString(sampleDate, 'Asia/Kolkata');
    expect(dateStr).toBe('2026-10-23');
  });
});
