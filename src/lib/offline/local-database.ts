import {
  Medicine,
  MedicationSchedule,
  DoseEvent,
  EmergencyContact,
  CaregiverRelationship,
  Profile,
  LifespanStage,
} from '@/lib/types/database';

const STORAGE_KEYS = {
  PROFILE: 'medremind_local_profile',
  MEDICINES: 'medremind_local_medicines',
  SCHEDULES: 'medremind_local_schedules',
  DOSE_EVENTS: 'medremind_local_dose_events',
  EMERGENCY: 'medremind_local_emergency',
  CAREGIVERS: 'medremind_local_caregivers',
  AUDIT: 'medremind_local_audit',
  INITIALIZED: 'medremind_local_initialized_v2',
};

// Rich Lifespan Healthcare Seed Data (from 1 day old to 100+ years old)
const DEFAULT_LIFESPAN_MEDICINES: Medicine[] = [
  // 1. 🍼 INFANT & BABY (1 day to 2 years)
  {
    id: 'med_infant_1',
    patient_id: 'local_user',
    name: 'विटामिन D3 ड्रॉप्स (Vitamin D3 Infant Drops 400 IU)',
    prescribed_dose: '0.5 ml (1 ड्रॉपर)',
    route: 'drops',
    instructions: 'नवजात शिशु की हड्डियों व विकास हेतु सुबह दूध पिलाने के बाद',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'infant',
    color_tag: 'yellow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med_infant_2',
    patient_id: 'local_user',
    name: 'हेपेटाइटिस B व पोलियो ड्रॉप्स (Vaccination Milestone)',
    prescribed_dose: '2 बूँदें (Oral Drops)',
    route: 'drops',
    instructions: 'बाल रोग विशेषज्ञ के टीकाकरण चार्ट के अनुसार',
    is_prn: true,
    is_archived: false,
    lifespan_target: 'infant',
    color_tag: 'purple',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. 🧒 CHILD (3 to 12 years)
  {
    id: 'med_child_1',
    patient_id: 'local_user',
    name: 'पैरासिटामोल सिरप (Paracetamol Paediatric 120mg/5ml)',
    prescribed_dose: '5 ml (1 चम्मच)',
    route: 'syrup',
    instructions: 'बच्चे को 100°F से अधिक बुखार या दांत दर्द होने पर',
    is_prn: true,
    is_archived: false,
    lifespan_target: 'child',
    color_tag: 'red',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. 🧑 ADULT (13 to 59 years)
  {
    id: 'med_adult_1',
    patient_id: 'local_user',
    name: 'पैंटोप्राजोल (Pantoprazole 40mg)',
    prescribed_dose: '1 गोली (Tablet)',
    route: 'oral',
    instructions: 'एसिडिटी व गैस से बचाव के लिए सुबह उठते ही खाली पेट',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'adult',
    color_tag: 'blue',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med_adult_2',
    patient_id: 'local_user',
    name: 'मल्टीविटामिन व जिंक (Daily Multivitamin & Zinc)',
    prescribed_dose: '1 कैप्सूल',
    route: 'oral',
    instructions: 'दैनिक ऊर्जा व रोग प्रतिरोधक क्षमता हेतु दोपहर खाने के बाद',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'adult',
    color_tag: 'green',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. 🧓 SENIOR CITIZEN (60+ years)
  {
    id: 'med_senior_1',
    patient_id: 'local_user',
    name: 'एम्लोडिपिन (Amlodipine 5mg)',
    prescribed_dose: '1 गोली (बीपी की दवा)',
    route: 'oral',
    instructions: 'उच्च रक्तचाप नियंत्रण: सुबह नाश्ते के बाद 1 गोली पानी से',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'senior',
    color_tag: 'blue',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med_senior_2',
    patient_id: 'local_user',
    name: 'मेटफ़ॉर्मिन (Metformin 500mg SR)',
    prescribed_dose: '1 गोली (शुगर नियंत्रण)',
    route: 'oral',
    instructions: 'डायबिटीज: रात को डिनर के तुरंत बाद गुनगुने पानी से',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'senior',
    color_tag: 'white',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'med_senior_3',
    patient_id: 'local_user',
    name: 'एटोर्वास्टेटिन (Atorvastatin 10mg)',
    prescribed_dose: '1 गोली (कोलेस्ट्रॉल)',
    route: 'oral',
    instructions: 'हार्ट व कोलेस्ट्रॉल सुरक्षा: रात को सोने से पहले',
    is_prn: false,
    is_archived: false,
    lifespan_target: 'senior',
    color_tag: 'yellow',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_SCHEDULES: MedicationSchedule[] = [
  {
    id: 'sched_senior_1',
    medicine_id: 'med_senior_1',
    patient_id: 'local_user',
    schedule_type: 'once_daily',
    times_of_day: ['08:30'],
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: '2026-01-01',
    is_active: true,
    deduplication_hash: 'sched_senior_amlodipine',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sched_senior_2',
    medicine_id: 'med_senior_2',
    patient_id: 'local_user',
    schedule_type: 'once_daily',
    times_of_day: ['20:30'],
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: '2026-01-01',
    is_active: true,
    deduplication_hash: 'sched_senior_metformin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sched_adult_1',
    medicine_id: 'med_adult_1',
    patient_id: 'local_user',
    schedule_type: 'once_daily',
    times_of_day: ['07:30'],
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: '2026-01-01',
    is_active: true,
    deduplication_hash: 'sched_adult_pantoprazole',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sched_infant_1',
    medicine_id: 'med_infant_1',
    patient_id: 'local_user',
    schedule_type: 'once_daily',
    times_of_day: ['09:00'],
    days_of_week: [0, 1, 2, 3, 4, 5, 6],
    start_date: '2026-01-01',
    is_active: true,
    deduplication_hash: 'sched_infant_vitd3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PROFILE: Profile = {
  id: 'local_user',
  role: 'patient',
  display_name: 'रामेश्वर शर्मा जी',
  phone_number: '+919876543210',
  age: 68,
  lifespan_stage: 'senior',
  language_pref: 'hi',
  high_contrast_mode: false,
  text_size: 'large',
  timezone: 'Asia/Kolkata',
  emergency_sharing_consent: true,
  alarm_sound_enabled: true,
  alarm_volume: 0.9,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_EMERGENCY: EmergencyContact[] = [
  {
    id: 'ec_local_1',
    patient_id: 'local_user',
    contact_name: 'अमित शर्मा (पुत्र / मुख्य संपर्क)',
    relationship: 'बेटा (Son)',
    phone_number: '+919876501234',
    is_primary: true,
    consent_granted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'ec_local_2',
    patient_id: 'local_user',
    contact_name: 'डॉ. राजेश वर्मा (पारिवारिक चिकित्सक)',
    relationship: 'डॉक्टर (Doctor)',
    phone_number: '+919811122233',
    is_primary: false,
    consent_granted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_CAREGIVERS: CaregiverRelationship[] = [
  {
    id: 'cg_local_1',
    patient_id: 'local_user',
    caregiver_id: 'cg_amit',
    caregiver_name: 'अमित शर्मा (पुत्र)',
    caregiver_phone: '+919876501234',
    invitation_token_hash: 'hash_amit_verified',
    invitation_status: 'accepted',
    permissions: {
      can_view_medicines: true,
      can_edit_schedules: true,
      can_receive_missed_dose_alerts: true,
    },
    token_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Universal Self-Contained Local Database Class
 * Operates purely on local browser storage without requiring external Supabase setup!
 */
export class LocalDatabase {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Initializes default lifespan records on first visit
   */
  static init() {
    if (!this.isClient()) return;

    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(DEFAULT_LIFESPAN_MEDICINES));
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(DEFAULT_SCHEDULES));
      localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(DEFAULT_EMERGENCY));
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(DEFAULT_CAREGIVERS));
      localStorage.setItem(STORAGE_KEYS.DOSE_EVENTS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  // --- Profile & Lifespan Stage Management ---
  static getProfile(): Profile {
    if (!this.isClient()) return DEFAULT_PROFILE;
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static updateProfile(partial: Partial<Profile>): Profile {
    if (!this.isClient()) return DEFAULT_PROFILE;
    const current = this.getProfile();
    const updated = { ...current, ...partial, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    return updated;
  }

  static setLifespanStage(stage: LifespanStage): Profile {
    return this.updateProfile({ lifespan_stage: stage });
  }

  // --- Medicines CRUD ---
  static getMedicines(filterStage?: LifespanStage): Medicine[] {
    if (!this.isClient()) return DEFAULT_LIFESPAN_MEDICINES;
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDICINES);
      const list: Medicine[] = data ? JSON.parse(data) : DEFAULT_LIFESPAN_MEDICINES;
      if (filterStage) {
        return list.filter((m) => !m.lifespan_target || m.lifespan_target === filterStage);
      }
      return list;
    } catch {
      return DEFAULT_LIFESPAN_MEDICINES;
    }
  }

  static addMedicine(med: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>): Medicine {
    if (!this.isClient()) throw new Error('Client only');
    const list = this.getMedicines();
    const newMed: Medicine = {
      ...med,
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newMed);
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(list));
    this.logAudit('MEDICINE_CREATED', newMed.id, { name: newMed.name, dose: newMed.prescribed_dose });
    return newMed;
  }

  static updateMedicine(id: string, updates: Partial<Medicine>): Medicine | null {
    if (!this.isClient()) return null;
    const list = this.getMedicines();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(list));
    this.logAudit('MEDICINE_UPDATED', id, updates);
    return list[idx];
  }

  static archiveMedicine(id: string): boolean {
    const med = this.updateMedicine(id, { is_archived: true });
    return med !== null;
  }

  // --- Schedules CRUD ---
  static getSchedules(): MedicationSchedule[] {
    if (!this.isClient()) return DEFAULT_SCHEDULES;
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
      return data ? JSON.parse(data) : DEFAULT_SCHEDULES;
    } catch {
      return DEFAULT_SCHEDULES;
    }
  }

  static addSchedule(sched: Omit<MedicationSchedule, 'id' | 'created_at' | 'updated_at'>): MedicationSchedule {
    if (!this.isClient()) throw new Error('Client only');
    const list = this.getSchedules();
    const newSched: MedicationSchedule = {
      ...sched,
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newSched);
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(list));
    return newSched;
  }

  // --- Dose Events Tracking ---
  static getDoseEvents(): DoseEvent[] {
    if (!this.isClient()) return [];
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOSE_EVENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static recordDoseAction(
    doseEventId: string,
    action: 'take' | 'snooze' | 'miss',
    medicineId: string,
    scheduledFor: string,
    notes?: string
  ): DoseEvent {
    if (!this.isClient()) throw new Error('Client only');
    const list = this.getDoseEvents();
    const status = action === 'take' ? 'taken' : action === 'miss' ? 'missed' : 'scheduled';
    const nowIso = new Date().toISOString();

    const idx = list.findIndex((e) => e.id === doseEventId);
    let event: DoseEvent;

    if (idx !== -1) {
      list[idx].status = status;
      list[idx].confirmed_at = nowIso;
      list[idx].confirmation_source = 'patient';
      if (notes) list[idx].notes = notes;
      list[idx].updated_at = nowIso;
      event = list[idx];
    } else {
      event = {
        id: doseEventId,
        patient_id: 'local_user',
        medicine_id: medicineId,
        scheduled_for: scheduledFor,
        status,
        confirmed_at: nowIso,
        confirmation_source: 'patient',
        notes: notes || null,
        created_at: nowIso,
        updated_at: nowIso,
      };
      list.unshift(event);
    }

    localStorage.setItem(STORAGE_KEYS.DOSE_EVENTS, JSON.stringify(list));
    this.logAudit(`DOSE_${status.toUpperCase()}`, doseEventId, { action, notes });
    return event;
  }

  static correctDose(doseEventId: string, correctedStatus: DoseEvent['status'], reason: string): DoseEvent | null {
    if (!this.isClient()) return null;
    const list = this.getDoseEvents();
    const idx = list.findIndex((e) => e.id === doseEventId);
    if (idx === -1) return null;

    const prev = list[idx].status;
    list[idx].status = correctedStatus;
    list[idx].notes = `सुधार: ${reason} (पहले: ${prev})`;
    list[idx].updated_at = new Date().toISOString();

    localStorage.setItem(STORAGE_KEYS.DOSE_EVENTS, JSON.stringify(list));
    this.logAudit('DOSE_CORRECTED', doseEventId, { from: prev, to: correctedStatus, reason });
    return list[idx];
  }

  // --- Emergency Contacts CRUD ---
  static getEmergencyContacts(): EmergencyContact[] {
    if (!this.isClient()) return DEFAULT_EMERGENCY;
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMERGENCY);
      return data ? JSON.parse(data) : DEFAULT_EMERGENCY;
    } catch {
      return DEFAULT_EMERGENCY;
    }
  }

  static addEmergencyContact(contact: Omit<EmergencyContact, 'id' | 'created_at' | 'updated_at'>): EmergencyContact {
    if (!this.isClient()) throw new Error('Client only');
    const list = this.getEmergencyContacts();
    if (contact.is_primary) {
      list.forEach((c) => (c.is_primary = false));
    }
    const newContact: EmergencyContact = {
      ...contact,
      id: `ec_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newContact);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(list));
    return newContact;
  }

  // --- Caregivers CRUD ---
  static getCaregivers(): CaregiverRelationship[] {
    if (!this.isClient()) return DEFAULT_CAREGIVERS;
    this.init();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAREGIVERS);
      return data ? JSON.parse(data) : DEFAULT_CAREGIVERS;
    } catch {
      return DEFAULT_CAREGIVERS;
    }
  }

  static addCaregiver(name: string, phone: string, permissions: CaregiverRelationship['permissions']): { inviteUrl: string; caregiver: CaregiverRelationship } {
    const list = this.getCaregivers();
    const token = Math.random().toString(36).substring(2, 14);
    const newCg: CaregiverRelationship = {
      id: `cg_${Date.now()}`,
      patient_id: 'local_user',
      caregiver_name: name,
      caregiver_phone: phone,
      invitation_token_hash: token,
      invitation_status: 'pending',
      permissions,
      token_expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.unshift(newCg);
    localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(list));
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return {
      inviteUrl: `${origin}/caregivers/accept?token=${token}`,
      caregiver: newCg,
    };
  }

  static revokeCaregiver(id: string): boolean {
    const list = this.getCaregivers().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(list));
    return true;
  }

  // --- Audit Trail ---
  private static logAudit(action: string, resourceId: string, details?: any) {
    if (!this.isClient()) return;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      const list = data ? JSON.parse(data) : [];
      list.unshift({
        id: `audit_${Date.now()}`,
        action,
        resourceId,
        details,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(list.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  // --- Data Export & Reset (DPDP Act) ---
  static exportBundle() {
    return {
      export_date: new Date().toISOString(),
      profile: this.getProfile(),
      medicines: this.getMedicines(),
      schedules: this.getSchedules(),
      dose_history: this.getDoseEvents(),
      emergency_contacts: this.getEmergencyContacts(),
      caregivers: this.getCaregivers(),
      disclaimer: 'Personal health data export strictly for patient retention under DPDP Act 2023.',
    };
  }

  static resetDatabase() {
    if (!this.isClient()) return;
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.init();
  }
}
