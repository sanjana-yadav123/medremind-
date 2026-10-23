import { createAdminClient } from '@/lib/supabase/admin';
import { sendWebPushNotification, calculateBackoffDelayMs } from './web-push';

export interface NotificationJobResult {
  jobId: string;
  status: 'delivered' | 'failed' | 'retrying';
  error?: string;
}

/**
 * Worker function to claim and process due notification jobs
 */
export async function processDueNotificationJobs(batchLimit: number = 25): Promise<{ processed: number; results: NotificationJobResult[] }> {
  const supabase = createAdminClient();

  // 1. Claim due jobs using concurrency-safe database procedure (FOR UPDATE SKIP LOCKED)
  const { data: claimedJobs, error: claimError } = await supabase.rpc('claim_due_notification_jobs', {
    p_limit: batchLimit,
  });

  if (claimError) {
    throw new Error(`Failed to claim notification jobs: ${claimError.message}`);
  }

  if (!claimedJobs || claimedJobs.length === 0) {
    return { processed: 0, results: [] };
  }

  const results: NotificationJobResult[] = [];

  for (const job of claimedJobs) {
    try {
      // 2. Fetch active push subscriptions for the recipient
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', job.recipient_id)
        .eq('is_active', true);

      if (subError || !subscriptions || subscriptions.length === 0) {
        // No active subscription: mark job failed or delivered without push
        await supabase
          .from('notification_jobs')
          .update({
            status: 'failed',
            error_log: 'No active push subscriptions registered for recipient',
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.push({ jobId: job.id, status: 'failed', error: 'No active subscription' });
        continue;
      }

      let deliveredToAtLeastOne = false;
      let lastError: string | undefined;

      for (const sub of subscriptions) {
        const deliveryResult = await sendWebPushNotification(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          {
            title: job.title,
            body: job.body,
            doseEventId: job.dose_event_id,
            targetUrl: '/dashboard',
          }
        );

        if (deliveryResult.success) {
          deliveredToAtLeastOne = true;
          // Update subscription last notified
          await supabase
            .from('push_subscriptions')
            .update({ last_notified_at: new Date().toISOString(), failure_count: 0 })
            .eq('id', sub.id);
        } else {
          lastError = deliveryResult.error;
          // If subscription is 404/410 gone, deactivate it
          if (deliveryResult.shouldDeactivateSubscription) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false, failure_count: sub.failure_count + 1 })
              .eq('id', sub.id);
          } else {
            await supabase
              .from('push_subscriptions')
              .update({ failure_count: sub.failure_count + 1 })
              .eq('id', sub.id);
          }
        }
      }

      if (deliveredToAtLeastOne) {
        await supabase
          .from('notification_jobs')
          .update({ status: 'delivered', updated_at: new Date().toISOString() })
          .eq('id', job.id);
        results.push({ jobId: job.id, status: 'delivered' });
      } else {
        // Retry logic with bounded exponential backoff
        const nextAttempt = job.attempts;
        if (nextAttempt >= 3) {
          await supabase
            .from('notification_jobs')
            .update({
              status: 'failed',
              error_log: `Exceeded max retry attempts. Last error: ${lastError}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
          results.push({ jobId: job.id, status: 'failed', error: lastError });
        } else {
          const backoffDelay = calculateBackoffDelayMs(nextAttempt);
          const nextScheduledTime = new Date(Date.now() + backoffDelay).toISOString();
          await supabase
            .from('notification_jobs')
            .update({
              status: 'pending',
              scheduled_for: nextScheduledTime,
              error_log: `Retry ${nextAttempt} scheduled. Last error: ${lastError}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', job.id);
          results.push({ jobId: job.id, status: 'retrying', error: lastError });
        }
      }
    } catch (err: any) {
      results.push({ jobId: job.id, status: 'failed', error: err.message });
    }
  }

  return { processed: claimedJobs.length, results };
}
