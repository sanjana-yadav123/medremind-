export type UserRole = 'patient' | 'caregiver' | 'admin';

export type LifespanStage = 'infant' | 'child' | 'adult' | 'senior';

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string;
  phone_number?: string | null;
  age?: number;
  lifespan_stage: LifespanStage;
  language_pref: string;
  high_contrast_mode: boolean;
  text_size: 'normal' | 'large' | 'extra-large';
  timezone: string;
  emergency_sharing_consent: boolean;
  alarm_sound_enabled: boolean;
  alarm_volume: number; // 0 to 1
  created_at: string;
  updated_at: string;
}

export type MedicineRoute = 'oral' | 'drops' | 'syrup' | 'injection' | 'inhalation' | 'topical' | 'other';

export interface Medicine {
  id: string;
  patient_id: string;
  name: string;
  prescribed_dose: string;
  route: MedicineRoute;
  instructions: string;
  is_prn: boolean;
  is_archived: boolean;
  lifespan_target?: LifespanStage; // Targeted age group
  color_tag?: string;
  shape_tag?: string;
  created_at: string;
  updated_at: string;
}

export type ScheduleType = 'once_daily' | 'multiple_daily' | 'weekday_selected' | 'interval_days' | 'as_needed';

export interface MedicationSchedule {
  id: string;
  medicine_id: string;
  patient_id: string;
  schedule_type: ScheduleType;
  times_of_day: string[]; // ['08:00', '20:00']
  days_of_week: number[]; // [0..6]
  interval_days?: number | null;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  is_active: boolean;
  deduplication_hash: string;
  created_at: string;
  updated_at: string;
}

export type DoseStatus = 'scheduled' | 'taken' | 'skipped' | 'missed' | 'pending_confirmation';
export type ConfirmationSource = 'patient' | 'caregiver' | 'offline_sync' | 'alarm_dismiss';

export interface DoseEvent {
  id: string;
  schedule_id?: string | null;
  medicine_id: string;
  patient_id: string;
  scheduled_for: string; // ISO string
  status: DoseStatus;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  confirmation_source?: ConfirmationSource | null;
  notes?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
  medicine?: Medicine;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  relationship: string;
  phone_number: string;
  is_primary: boolean;
  consent_granted_at: string;
  created_at: string;
  updated_at: string;
}

export interface CaregiverRelationship {
  id: string;
  patient_id: string;
  caregiver_id?: string | null;
  caregiver_phone?: string | null;
  caregiver_name: string;
  invitation_token_hash: string;
  invitation_status: 'pending' | 'accepted' | 'declined' | 'revoked';
  permissions: {
    can_view_medicines: boolean;
    can_edit_schedules: boolean;
    can_receive_missed_dose_alerts: boolean;
  };
  token_expires_at: string;
  accepted_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExtractedMedicine {
  candidate_name: string;
  candidate_strength?: string;
  candidate_instructions?: string;
  candidate_frequency?: string;
  confidence_score: number;
  verified: boolean;
  target_age?: LifespanStage;
}

export interface Prescription {
  id: string;
  patient_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  ocr_status: 'pending' | 'processing' | 'completed' | 'failed';
  raw_ocr_text?: string | null;
  extracted_medicines: ExtractedMedicine[];
  is_verified_by_user: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
}
