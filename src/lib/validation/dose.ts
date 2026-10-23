import { z } from 'zod';

export const DoseActionSchema = z.object({
  dose_event_id: z.string().min(1, 'खुराक आईडी आवश्यक है'),
  action: z.enum(['take', 'snooze', 'skip', 'miss']),
  confirmed_at: z.string().datetime().optional(),
  notes: z.string().max(250).optional(),
  idempotency_key: z.string().min(8, 'अमान्य idempotency key').optional(),
});

export const DoseCorrectionSchema = z.object({
  dose_event_id: z.string().min(1, 'खुराक आईडी आवश्यक है'),
  corrected_status: z.enum(['scheduled', 'taken', 'skipped', 'missed']),
  correction_reason: z.string().min(3, 'सुधार का कारण लिखना अनिवार्य है (कम से कम 3 अक्षर)').max(300),
});

export type DoseActionInput = z.infer<typeof DoseActionSchema>;
export type DoseCorrectionInput = z.infer<typeof DoseCorrectionSchema>;

/**
 * Generates a deterministic unique dose event ID for a schedule occurrence
 */
export function generateDeterministicDoseId(patientId: string, scheduleId: string, occurrenceTimestampIso: string): string {
  // Normalize timestamp to UTC milliseconds epoch for stable string key
  const epoch = new Date(occurrenceTimestampIso).getTime();
  return `dose_${patientId.substring(0, 8)}_${scheduleId.substring(0, 8)}_${epoch}`;
}

/**
 * Validates whether a dose status transition is medically safe and allowed
 */
export function isValidDoseTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true; // Idempotent no-op

  // Scheduled or Pending -> can transition to taken, skipped, missed
  if (currentStatus === 'scheduled' || currentStatus === 'pending_confirmation') {
    return ['taken', 'skipped', 'missed'].includes(nextStatus);
  }

  // Missed -> can be updated to taken if patient actually took it late
  if (currentStatus === 'missed') {
    return ['taken', 'skipped'].includes(nextStatus);
  }

  // Taken -> can only be corrected to skipped/missed via explicit correction flow
  if (currentStatus === 'taken') {
    return ['skipped', 'missed', 'scheduled'].includes(nextStatus);
  }

  return true;
}
