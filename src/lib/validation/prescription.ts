import { z } from 'zod';

export const ALLOWED_PRESCRIPTION_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_PRESCRIPTION_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes

export const PrescriptionUploadSchema = z.object({
  file_name: z.string().min(1).max(255),
  file_size: z.number().int().positive().max(MAX_PRESCRIPTION_FILE_SIZE, 'फ़ाइल 10MB से छोटी होनी चाहिए'),
  mime_type: z.enum(ALLOWED_PRESCRIPTION_MIME_TYPES, {
    errorMap: () => ({ message: 'केवल JPEG, PNG, WEBP या PDF फ़ाइलें ही स्वीकार्य हैं' }),
  }),
});

export const ExtractedMedicineSchema = z.object({
  candidate_name: z.string().min(1, 'दवा का नाम आवश्यक है').trim(),
  candidate_strength: z.string().optional(),
  candidate_instructions: z.string().optional(),
  candidate_frequency: z.string().optional(),
  confidence_score: z.number().min(0).max(1),
  verified: z.boolean().default(false),
});

export const VerifyPrescriptionSchema = z.object({
  prescription_id: z.string().uuid(),
  verified_medicines: z.array(ExtractedMedicineSchema),
});

export type PrescriptionUploadInput = z.infer<typeof PrescriptionUploadSchema>;
export type VerifyPrescriptionInput = z.infer<typeof VerifyPrescriptionSchema>;
