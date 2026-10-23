import { z } from 'zod';

export const EmergencyContactSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  contact_name: z.string().min(2, 'संपर्क व्यक्ति का नाम दर्ज करें').max(100).trim(),
  relationship: z.string().min(2, 'संबंध (जैसे बेटा, बेटी, डॉक्टर) दर्ज करें').max(50).trim(),
  phone_number: z.string().regex(/^\+?[0-9]{10,14}$/, 'मान्य 10-अंकों का मोबाइल नंबर दर्ज करें (उदा. +919876543210)'),
  is_primary: z.boolean().default(false),
  consent_granted: z.boolean().refine((val) => val === true, {
    message: 'आपातकालीन संपर्क जोड़ने के लिए सहमति देना अनिवार्य है',
  }),
});

export type EmergencyContactInput = z.infer<typeof EmergencyContactSchema>;
