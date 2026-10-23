# MedRemind: Android Mobile Browser & PWA Testing Checklist

This checklist provides a systematic QA protocol for testing MedRemind across low-to-mid tier Android smartphones (e.g. Samsung Galaxy, Redmi/Xiaomi, Realme, Vivo) and mobile browsers commonly used in India.

---

## 1. Device & Browser Compatibility Matrix

- [ ] **Google Chrome for Android** (v115+)
- [ ] **Samsung Internet Browser** (v21+)
- [ ] **Firefox for Android** (v115+)
- [ ] **Android WebView / PWA Standalone Mode**

---

## 2. Test Scenarios & Verification Steps

### A. PWA Installation & Service Worker
- [ ] **Install Prompt**: Open Chrome for Android. Verify "Install App" or "Add to Home screen" banner/option appears.
- [ ] **Standalone Launch**: Launch app from home screen icon. Verify URL bar is hidden and theme color `#15803d` is applied to status bar.
- [ ] **Service Worker**: Open `chrome://serviceworker-internals` on device or DevTools. Verify `/sw.js` is active and controlling scope `/`.

### B. Elderly Touch Accessibility & Visual Clarity
- [ ] **Primary Action Buttons**: Verify "दवा ले ली", "बाद में याद दिलाएँ", and "छूटी हुई दवा" have a minimum touch target height of >= 64px.
- [ ] **Font Size Scaling**: Switch text size in Settings from Normal to Large (20px) and Extra-Large (24px). Ensure no text overlaps or clips on small 360px-wide screens.
- [ ] **High Contrast Mode**: Toggle High Contrast mode in Header. Verify strong dark borders and visible focus rings appear around interactive cards and inputs.
- [ ] **No Color-Only Status**: Verify that dose statuses display an explicit text label and icon (e.g., Check icon + "ले ली", Clock icon + "बाकी"), never color alone.

### C. Voice Assistant & Web Speech API
- [ ] **Microphone Permission**: Tap microphone button. Verify browser prompts for microphone permission in Hindi/English.
- [ ] **Speech Recognition**: Say clearly in Hindi: *"अगली दवा कब है?"*. Verify transcript is displayed accurately.
- [ ] **Speech Synthesis**: Verify Hindi voice response speaks the correct upcoming medicine name and scheduled time.
- [ ] **Safety Confirmation**: Say *"दवा ले ली"*. Verify app prompts with an explicit confirmation dialog before recording the dose.

### D. Emergency SOS & Native Dialer
- [ ] **SOS Button Tap**: Tap red SOS button. Verify 2-step confirmation modal opens.
- [ ] **Dialer Launch**: Tap "कॉल करें". Verify Android native phone dialer opens with contact's phone number pre-filled.
- [ ] **Disclaimer Notice**: Verify disclaimer is clearly visible indicating that the user must press Call on their dialer and that 112 should be called for acute life threats.

### E. Offline Mode & Airplane Mode Sync
- [ ] **Go Offline**: Turn on **Airplane Mode** on the Android device.
- [ ] **Banner Display**: Verify yellow "ऑफ़लाइन मोड (No Internet)" banner appears at top.
- [ ] **Record Dose While Offline**: Tap "दवा ले ली" on a scheduled medicine. Verify status updates optimistically and banner shows "1 बदलाव सहेजा गया है".
- [ ] **Reconnect Network**: Turn off Airplane Mode.
- [ ] **Automatic Sync**: Verify queue flushes automatically, pending count drops to 0, and green "सभी बदलाव सफलतापूर्वक सिंक हो गए!" notification appears.

### F. Android TalkBack Screen Reader
- [ ] **Turn on TalkBack** in Android Accessibility settings.
- [ ] **Navigation Landmark**: Verify TalkBack announces `<header>`, `<main>`, and bottom `<nav>` landmarks.
- [ ] **Button Labels**: Verify buttons announce their full Hindi description (e.g., "दवा ले ली, बटन").
- [ ] **Modal Trapping**: Verify focus does not escape when Emergency SOS or Voice Assistant modal is open.
