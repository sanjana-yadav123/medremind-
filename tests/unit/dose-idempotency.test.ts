import { describe, it, expect } from 'vitest';
import { generateDeterministicDoseId, isValidDoseTransition } from '@/lib/validation/dose';

describe('Dose Event Idempotency and State Transition Rules', () => {
  const patientId = '12345678-aaaa-bbbb-cccc-111122223333';
  const scheduleId = '87654321-dddd-eeee-ffff-444455556666';
  const occurrenceTimestampIso = '2026-10-23T02:30:00.000Z'; // 08:00 AM IST

  it('generates stable deterministic dose event IDs', () => {
    const id1 = generateDeterministicDoseId(patientId, scheduleId, occurrenceTimestampIso);
    const id2 = generateDeterministicDoseId(patientId, scheduleId, occurrenceTimestampIso);

    expect(id1).toBe(id2);
    expect(id1).toContain('dose_12345678_87654321_');
  });

  it('generates different IDs for different scheduled occurrence times', () => {
    const id1 = generateDeterministicDoseId(patientId, scheduleId, '2026-10-23T02:30:00.000Z');
    const id2 = generateDeterministicDoseId(patientId, scheduleId, '2026-10-23T14:30:00.000Z');

    expect(id1).not.toBe(id2);
  });

  it('validates permitted dose state transitions', () => {
    // Scheduled can transition to taken, skipped, missed
    expect(isValidDoseTransition('scheduled', 'taken')).toBe(true);
    expect(isValidDoseTransition('scheduled', 'skipped')).toBe(true);
    expect(isValidDoseTransition('scheduled', 'missed')).toBe(true);

    // Idempotent retry (same to same) is always valid
    expect(isValidDoseTransition('taken', 'taken')).toBe(true);
    expect(isValidDoseTransition('skipped', 'skipped')).toBe(true);

    // Missed dose can be marked taken if user took it late
    expect(isValidDoseTransition('missed', 'taken')).toBe(true);

    // Taken can be corrected via correction flow
    expect(isValidDoseTransition('taken', 'skipped')).toBe(true);
  });
});
