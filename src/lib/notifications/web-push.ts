import webpush from 'web-push';

// Configure VAPID keys if present in environment
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@medremind.local';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  doseEventId?: string | null;
  targetUrl?: string;
  tag?: string;
}

/**
 * Sends a push notification to a user's subscription with error handling
 */
export async function sendWebPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ success: boolean; statusCode?: number; shouldDeactivateSubscription: boolean; error?: string }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return {
      success: false,
      shouldDeactivateSubscription: false,
      error: 'VAPID credentials not configured on server',
    };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    const res = await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
      TTL: 60 * 60, // 1 hour time-to-live
      urgency: 'high',
    });

    return {
      success: true,
      statusCode: res.statusCode,
      shouldDeactivateSubscription: false,
    };
  } catch (error: any) {
    const statusCode = error.statusCode;

    // HTTP 404 Not Found or 410 Gone means the push subscription has expired or unsubscribed
    const shouldDeactivate = statusCode === 404 || statusCode === 410;

    return {
      success: false,
      statusCode,
      shouldDeactivateSubscription: shouldDeactivate,
      error: error.message || 'Push delivery failed',
    };
  }
}

/**
 * Calculates exponential backoff with bounded jitter
 */
export function calculateBackoffDelayMs(attemptNumber: number, baseMs: number = 30000, maxMs: number = 600000): number {
  const exp = Math.min(attemptNumber, 5);
  const delay = baseMs * Math.pow(2, exp);
  // Add random jitter between 0 and 5000ms
  const jitter = Math.floor(Math.random() * 5000);
  return Math.min(delay + jitter, maxMs);
}
