# MedRemind: Smart Medicine & Health Assistant for Elderly People

> **बहुभाषी (हिंदी, বাংলা, मराठी, தமிழ், తెలుగు, ગુજરાતી, English), मोबाइल-प्रथम एवं सुलभ स्वास्थ्य व दवा सहायक (PWA)**  
> Built for elderly Indian citizens and their family caregivers with minimal, attractive healthcare UI.

---

## 1. Product Overview & Enhancements

MedRemind is an accessible, progressive web application (PWA) designed specifically for older adults in India. It combines modern glassmorphic minimal design with deep accessibility features.

### Key Capabilities & New Enhancements
- **Minimal, Serene Healthcare UI**: Soothing mint-and-sage ambient background (`#f0fdf4` / `#ecfdf5`), soft glassmorphic rounded cards, clear elevations, and high-contrast readability.
- **7 Regional Indian Languages**: Instant one-tap switching between:
  - 🇮🇳 **हिंदी (Hindi)**
  - 🇬🇧 **English**
  - 🇮🇳 **বাংলা (Bengali)**
  - 🇮🇳 **मराठी (Marathi)**
  - 🇮🇳 **தமிழ் (Tamil)**
  - 🇮🇳 **తెలుగు (Telugu)**
  - 🇮🇳 **ગુજરાતી (Gujarati)**
- **Intelligent Voice Assistant with Offline Audio Chime**:
  - Web Audio API synthesizer generates gentle harmonic audio tones (C5-G5 chime) when the mic begins listening and when dose confirmation succeeds, giving elderly users instant audible feedback without having to look at the screen.
  - Conversational NLP recognition across all supported regional dialects.
  - Speaks responses using native regional voice synthesis at an elderly-tuned pace (0.88x).
- **AI Prescription Scanner with Indian Drug Safety Knowledge**:
  - Recognizes top Indian chronic & acute generics and popular brands (Amlodipine/Amlong, Metformin/Glycomet, Pantoprazole/Pan, Atorvastatin/Storvas, Telmisartan/Telma, Paracetamol/Dolo, Thyroxine/Thyronorm).
  - Automatically flags clinical drug timing warnings (e.g., *"सुबह खाली पेट (Empty Stomach)"*, *"भोजन के तुरंत बाद"*).
  - Multi-modal vision architecture with mandatory human review before saving to active schedule.
- **Offline-First Synchronization (PWA + IndexedDB)**:
  - Full local persistence: doses can be confirmed or snoozed even in airplane mode.
  - Background synchronization when network returns with automatic optimistic state updates.
- **Emergency SOS & Native Dialer**:
  - Two-step confirmation with zero false emergency dispatch claims.
  - One-tap launch into the Android device dialer (`tel:`) for National 112 and designated family caregivers.
- **Security & Privacy (DPDP Act 2023)**:
  - Strict PostgreSQL Row Level Security (RLS) across all 10 schema tables.
  - One-click health record data export (`/api/export`) and right to erasure (`/api/delete-account`).

---

## 2. Mandatory Tech Stack & Architecture

- **Frontend**: Next.js App Router (TypeScript, React), Tailwind CSS with custom elderly accessibility extensions.
- **Database & Auth**: Supabase PostgreSQL with 10 Row Level Security migrations, private Supabase Storage for prescriptions.
- **PWA & Offline**: Web App Manifest (`public/manifest.webmanifest`), Service Worker (`public/sw.js`), and IndexedDB (`idb`).
- **Push Reminders**: Web Push with VAPID keys and a concurrency-safe server scheduler (`FOR UPDATE SKIP LOCKED`).
- **Validation**: Zod schemas for all untrusted client inputs and database mutations.
- **Testing**: Vitest for unit tests and Playwright for mobile E2E tests.

---

## 3. Quickstart & Commands

```bash
cd C:\Users\ASUS\.gemini\antigravity\scratch\medremind

# 1. Install dependencies
npm install

# 2. Configure environment (.env.example -> .env.local)
cp .env.example .env.local

# 3. Start local development server
npm run dev

# 4. Run unit tests
npm run test

# 5. Production build
npm run build
```
