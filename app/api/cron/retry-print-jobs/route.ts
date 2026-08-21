// app/api/cron/retry-print-jobs/route.ts
import { NextResponse } from 'next/server';
import { retryFailedPrintJobs } from '@/lib/cron/retry-print-jobs';

export async function GET() {
  try {
    await retryFailedPrintJobs();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cron job failed', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}