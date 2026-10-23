import { z } from 'zod';

export const MedicineSchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional(),
  name: z.string().min(1, 'दवा का नाम आवश्यक है').max(150, 'दवा का नाम बहुत लंबा है').trim(),
  prescribed_dose: z.string().min(1, 'खुराक दर्ज करें (उदा. 500mg, 1 गोली)').max(100).trim(),
  route: z.enum(['oral', 'injection', 'inhalation', 'topical', 'drops', 'other']).default('oral'),
  instructions: z.string().min(1, 'डॉक्टर की लिखी हिदायत दर्ज करें').max(500).trim(),
  is_prn: z.boolean().default(false),
  is_archived: z.boolean().default(false),
  color_tag: z.string().optional().default('green'),
  shape_tag: z.string().optional().default('round'),
});

export type MedicineInput = z.infer<typeof MedicineSchema>;
