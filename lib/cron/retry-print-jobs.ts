// lib/cron/retry-print-jobs.ts
import { db } from '@/lib/prisma';
import { printJobRepository } from '@/repositories/print-job.repository';
import { processKitchenPrintJob } from '@/services/print-job.service';

export async function retryFailedPrintJobs() {
  const failedJobs = await db.tbl_print_jobs.findMany({
    where: {
      status: 'FAILED',
      retry_count: { lt: 3 }, // retry tối đa 3 lần
    },
    orderBy: { created_at: 'asc' },
    take: 50,
  });

  for (const job of failedJobs) {
    // Đưa về WAITING
    await db.$transaction(async (tx) => {
      await printJobRepository.retryPrintJob(tx, job.id);
    });
    // Xử lý lại
    await processKitchenPrintJob(job.id).catch((err) =>
      console.error(`Retry job ${job.id} failed`, err)
    );
  }
}