import { z } from 'zod';

export const CaregiverInviteSchema = z.object({
  caregiver_name: z.string().min(2, 'देखभालकर्ता का नाम दर्ज करें').max(100).trim(),
  caregiver_phone: z.string().regex(/^\+?[0-9]{10,14}$/, 'अमान्य मोबाइल नंबर (उदा. +919876543210)').optional().nullable(),
  permissions: z.object({
    can_view_medicines: z.boolean().default(true),
    can_edit_schedules: z.boolean().default(false),
    can_receive_missed_dose_alerts: z.boolean().default(true),
  }),
});

export const AcceptCaregiverInviteSchema = z.object({
  token: z.string().min(16, 'अमान्य आमंत्रण टोकन'),
});

export const RevokeCaregiverSchema = z.object({
  relationship_id: z.string().uuid('अमान्य संबंध आईडी'),
});

export type CaregiverInviteInput = z.infer<typeof CaregiverInviteSchema>;
