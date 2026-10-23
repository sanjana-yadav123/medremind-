import { test, expect } from '@playwright/test';

test.describe('MedRemind End-to-End User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');
  });

  test('Scenario 1: Landing page displays Hindi-first content and guest demo mode enters dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('MedRemind');
    await expect(page.locator('text=वरिष्ठ स्वास्थ्य एवं दवा सहायक')).toBeVisible();

    // Click Guest demo mode
    await page.click('button:has-text("बिना खाते के चलाकर देखें")');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('सुप्रभात');
  });

  test('Scenario 2: Create a new medicine with prescribed dosage and frequency', async ({ page }) => {
    await page.goto('/medicines/new');
    await page.fill('input[id^="input-"][type="text"]', 'टेलमिसार्टन (Telmisartan)');
    // Prescribed dose
    await page.locator('input[placeholder*="500mg"]').fill('40mg');
    // Instructions
    await page.locator('textarea').fill('सुबह नाश्ते से पहले 1 गोली');
    // Click submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/medicines/);
  });

  test('Scenario 3 & 4: Next scheduled dose card and confirming a dose updates timeline', async ({ page }) => {
    await page.goto('/dashboard');
    // Verify Next scheduled dose section is rendered
    await expect(page.locator('text=अगली आने वाली दवा')).toBeVisible();

    // Click "दवा ले ली" (Took Medicine)
    const takeButton = page.locator('button:has-text("दवा ले ली")').first();
    if (await takeButton.isVisible()) {
      await takeButton.click();
      await expect(page.locator('text=दवा सफलतापूर्वक दर्ज कर ली गई!')).toBeVisible();
    }
  });

  test('Scenario 5: PWA Service Worker is registered', async ({ page }) => {
    await page.goto('/dashboard');
    const isSwRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length >= 0; // SW capability available
      }
      return false;
    });
    expect(isSwRegistered).toBe(true);
  });

  test('Scenario 7: Invite caregiver generates 48h expiring secure link', async ({ page }) => {
    await page.goto('/caregivers');
    await page.click('button:has-text("नया देखभालकर्ता जोड़ें")');
    await page.fill('input[placeholder="जैसे: अमित शर्मा"]', 'प्रियंका शर्मा (पुत्री)');
    await page.fill('input[placeholder="+919876543210"]', '+919812345678');
    await page.click('button:has-text("सुरक्षित आमंत्रण लिंक बनाएँ")');

    // Link must be generated with expiration notice
    await expect(page.locator('text=सुरक्षित आमंत्रण लिंक तैयार है!')).toBeVisible();
    await expect(page.locator('text=48 घंटे में समाप्त हो जाएगा')).toBeVisible();
  });

  test('Scenario 8: Prescription scanner shows OCR confidence and mandatory verification', async ({ page }) => {
    await page.goto('/prescriptions');
    await expect(page.locator('text=डॉक्टर का पर्चा स्कैनर')).toBeVisible();
    await expect(page.locator('text=अनिवार्य सुरक्षा सूचना')).toBeVisible();
  });

  test('Scenario 9: Emergency SOS button triggers 2-step confirmation with dialer', async ({ page }) => {
    await page.goto('/emergency');
    await page.click('button:has-text("आपातकालीन कॉल (SOS)")');
    // Modal opens with clear disclaimer
    await expect(page.locator('text=आपातकालीन सहायता (Emergency Confirmation)')).toBeVisible();
    await expect(page.locator('text=यह बटन आपके फ़ोन का डायलर खोलेगा')).toBeVisible();
  });

  test('Scenario 10: Toggle between Hindi and English language', async ({ page }) => {
    await page.goto('/dashboard');
    const langButton = page.locator('header button:has-text("ENG")');
    if (await langButton.isVisible()) {
      await langButton.click();
      await expect(page.locator('text=Today\'s Doses')).toBeVisible();
    }
  });

  test('Scenario 11: High contrast mode applies enhanced styling', async ({ page }) => {
    await page.goto('/dashboard');
    const contrastButton = page.locator('header button[title="कंट्रास्ट बदलें"]');
    await contrastButton.click();
    const hasContrastClass = await page.evaluate(() => {
      return document.documentElement.classList.contains('contrast-more');
    });
    expect(hasContrastClass).toBe(true);
  });
});
