import { describe, it, expect } from 'vitest';
import { hashInvitationToken, generateInvitationToken } from '@/lib/security/auth-guard';
import { CaregiverInviteSchema } from '@/lib/validation/caregiver';

describe('Caregiver Invitation Security and Expiration', () => {
  it('generates random high-entropy tokens and hashes them predictably with SHA-256', () => {
    const rawToken = generateInvitationToken();
    expect(rawToken.length).toBeGreaterThanOrEqual(32);

    const hash1 = hashInvitationToken(rawToken);
    const hash2 = hashInvitationToken(rawToken);

    // Hashing must be deterministic
    expect(hash1).toBe(hash2);
    // Hash must not equal raw token
    expect(hash1).not.toBe(rawToken);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it('validates caregiver invite inputs via Zod schema', () => {
    const validInvite = {
      caregiver_name: 'अमित शर्मा',
      caregiver_phone: '+919876543210',
      permissions: {
        can_view_medicines: true,
        can_edit_schedules: false,
        can_receive_missed_dose_alerts: true,
      },
    };

    const result = CaregiverInviteSchema.safeParse(validInvite);
    expect(result.success).toBe(true);

    // Invalid phone number rejection
    const invalidPhone = {
      ...validInvite,
      caregiver_phone: '1234',
    };
    const badResult = CaregiverInviteSchema.safeParse(invalidPhone);
    expect(badResult.success).toBe(false);
  });
});
