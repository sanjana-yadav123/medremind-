import { z } from 'zod';

export const ScheduleTimeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format

export const MedicationScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  medicine_id: z.string().uuid('अमान्य दवा आईडी'),
  patient_id: z.string().uuid().optional(),
  schedule_type: z.enum(['once_daily', 'multiple_daily', 'weekday_selected', 'interval_days', 'as_needed']),
  times_of_day: z.array(z.string().regex(ScheduleTimeRegex, 'समय प्रारूप HH:mm (जैसे 08:00) होना चाहिए')).min(0),
  days_of_week: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  interval_days: z.number().int().positive().nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'तारीख का प्रारूप YYYY-MM-DD होना चाहिए'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'तारीख का प्रारूप YYYY-MM-DD होना चाहिए').nullable().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  if (data.schedule_type !== 'as_needed' && data.times_of_day.length === 0) {
    return false;
  }
  return true;
}, {
  message: 'नियमित दवा के लिए कम से कम एक समय निर्धारित करना आवश्यक है',
  path: ['times_of_day'],
}).refine((data) => {
  if (data.end_date && data.start_date && data.end_date < data.start_date) {
    return false;
  }
  return true;
}, {
  message: 'समाप्ति तारीख शुरू तारीख से पहले नहीं हो सकती',
  path: ['end_date'],
});

export type MedicationScheduleInput = z.infer<typeof MedicationScheduleSchema>;

/**
 * Generate a deterministic deduplication hash for schedules to prevent accidental duplicates
 */
export function generateScheduleDedupHash(medicineId: string, scheduleType: string, times: string[], days: number[]): string {
  const sortedTimes = [...times].sort().join(',');
  const sortedDays = [...days].sort().join(',');
  return `sched_${medicineId}_${scheduleType}_${sortedTimes}_${sortedDays}`;
}
