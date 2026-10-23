import { describe, it, expect } from 'vitest';
import { calculateBackoffDelayMs } from '@/lib/notifications/web-push';

describe('Notification Retry Backoff Calculation', () => {
  it('increases delay with successive retry attempts', () => {
    const delay0 = calculateBackoffDelayMs(0, 30000, 600000);
    const delay1 = calculateBackoffDelayMs(1, 30000, 600000);
    const delay2 = calculateBackoffDelayMs(2, 30000, 600000);

    expect(delay1).toBeGreaterThanOrEqual(delay0);
    expect(delay2).toBeGreaterThanOrEqual(delay1);
  });

  it('respects the maximum bounded backoff ceiling', () => {
    const maxCeiling = 120000; // 2 minutes max
    const highAttemptDelay = calculateBackoffDelayMs(10, 30000, maxCeiling);

    expect(highAttemptDelay).toBeLessThanOrEqual(maxCeiling);
  });
});
