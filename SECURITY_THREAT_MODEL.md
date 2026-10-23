# MedRemind: Security Threat Model & Privacy Architecture

This document outlines the security controls, privacy protections, and threat mitigations implemented across MedRemind, adhering to Indian healthcare security standards and the **Digital Personal Data Protection (DPDP) Act 2023**.

---

## 1. Threat Matrix & Mitigations

| Threat | Risk Level | Attack Vector | Mitigation Strategy in MedRemind |
| :--- | :--- | :--- | :--- |
| **Unauthorized Caregiver Access** | High | Guessing IDs or intercepted links | Single-use high-entropy tokens hashed via SHA-256 with 48h expiration. RLS ensures only `accepted` relationships grant read access. Immediate revocation supported. |
| **Cross-Patient Data Leakage** | Critical | Direct database queries or API parameter tampering | Strict PostgreSQL Row Level Security (RLS) on all 10 tables. `patient_id = auth.uid()` checked server-side; client cannot spoof patient ID. |
| **Malicious File Uploads** | High | Exploited PDFs/images in prescription upload | MIME validation against whitelist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), 10MB file limit, UUID storage paths in private bucket. No public bucket access. |
| **Stolen / Shared Device** | Medium | Family member accessing phone | Session management with cookie HttpOnly flags, local biometric lock guidance, instant logout, and sensitive settings confirmation. |
| **Leaked Push Endpoints** | Low | Eavesdropping on browser push subscription | Payloads do not include sensitive diagnostic names in notification bodies by default. VAPID encryption applied; subscriptions pruned on 410/404 errors. |
| **Duplicate / Racing Dose Logs** | Medium | Concurrent offline/online sync | Deterministic dose event IDs (`dose_{patientId}_{scheduleId}_{epoch}`) enforce database uniqueness. Retries are strictly idempotent. |

---

## 2. Indian DPDP Act 2023 Compliance Checklist

1. **Explicit Consent Architecture**:
   - Patient consent required at signup for health data storage.
   - Specific, revocable consent for sharing with each family caregiver.
   - Explicit consent before configuring emergency contacts.
2. **Right to Access & Data Portability**:
   - `/api/export` endpoint allows one-click download of all profile, medicine, schedule, dose history, and contact records in standard JSON format.
3. **Right to Erasure (Account Deletion)**:
   - `/api/delete-account` completely purges patient profiles and triggers cascading deletion of all associated medicines, schedules, dose events, and emergency contacts.
4. **Data Minimization & Redaction**:
   - IP addresses stored in audit logs are redacted (e.g. `192.168.xxx.xxx`).
   - Prescription storage paths are obfuscated with non-sequential UUIDs.

---

## 3. Data Retention & Storage Policy

- **Prescription Scans**: Stored in private Supabase Storage buckets accessible only via signed short-lived URLs (maximum 15 minutes TTL).
- **Audit Logs**: Retained for 180 days for security traceability, recording only operational metadata without medical diagnosis duplication.
- **Push Subscriptions**: Automatically marked inactive after 3 consecutive delivery failures (HTTP 404/410).

---

## 4. Disaster Recovery & Backup Strategy

1. **Automated Database Backups**: Supabase Point-in-Time Recovery (PITR) with daily WAL archiving.
2. **Offline Resilience**: Local client storage in IndexedDB guarantees that users can record and review doses even during extended cellular network outages.
3. **Graceful Fallbacks**: In-app upcoming reminders provide a foreground fallback if mobile OS battery optimization suppresses background push notifications.
