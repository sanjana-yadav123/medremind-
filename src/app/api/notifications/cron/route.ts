import { NextRequest, NextResponse } from 'next/server';
import { processDueNotificationJobs } from '@/lib/notifications/scheduler';

export async function POST(req: NextRequest) {
  try {
    // Verify Cron Secret header
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized scheduler trigger' }, { status: 401 });
    }

    // Process up to 30 due jobs
    const summary = await processDueNotificationJobs(30);

    return NextResponse.json({
      success: true,
      processed: summary.processed,
      results: summary.results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Cron reminder job failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Allow GET for simple manual verification with token query
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('token');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await processDueNotificationJobs(10);
  return NextResponse.json({
    success: true,
    processed: summary.processed,
    results: summary.results,
  });
}
