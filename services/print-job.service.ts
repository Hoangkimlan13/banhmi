import { db } from '@/lib/prisma';
import { printJobRepository } from '@/repositories/print-job.repository';

/**
 * Xử lý in một job cụ thể (KITCHEN).
 * - Lấy job từ DB (status = WAITING)
 * - Gọi máy in (HTTP request)
 * - Cập nhật status: PRINTED hoặc FAILED
 */
export async function processKitchenPrintJob(jobId: bigint): Promise<void> {
  // Lấy job
  const job = await db.tbl_print_jobs.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error(`Print job ${jobId} not found`);
  }

  // Nếu job không phải KITCHEN hoặc đã in rồi, bỏ qua
  if (job.job_type !== 'KITCHEN' || job.status === 'PRINTED') {
    console.log(`[Print Job] Job ${jobId} already processed or not kitchen`);
    return;
  }

  // Chỉ xử lý nếu status = WAITING (tránh xung đột)
  if (job.status !== 'WAITING') {
    console.log(`[Print Job] Job ${jobId} status is ${job.status}, skip`);
    return;
  }

  // Đánh dấu đang in (PRINTING)
  await db.$transaction(async (tx) => {
    const updated = await printJobRepository.markPrinting(tx, jobId);
    if (!updated || updated.status !== 'PRINTING') {
      throw new Error(`Failed to mark job ${jobId} as PRINTING`);
    }
    return updated;
  });

  // --- Gọi máy in (thay bằng logic thực tế) ---
  try {
    // Lấy order để lấy thông tin cần in
    const order = await db.tbl_customer_orders.findUnique({
      where: { id: job.order_id },
      include: {
        tbl_customer_order_items: true, // tùy cấu trúc của bạn
      },
    });

    if (!order) {
      throw new Error(`Order ${job.order_id} not found`);
    }

    // TODO: Gọi API đến máy in (Raspberry Pi / dịch vụ in)
    // Ví dụ:
    // const printerUrl = `http://printer-${job.store_id}.local/print`;
    // await fetch(printerUrl, { method: 'POST', body: JSON.stringify(order) });

    // Giả định in thành công
    await db.$transaction(async (tx) => {
      await printJobRepository.markPrinted(tx, jobId);
    });

    console.log(`[Print Job] Job ${jobId} printed successfully`);
  } catch (error) {
    // In thất bại → đánh dấu FAILED
    const errorMessage = error instanceof Error ? error.message : 'Unknown print error';
    await db.$transaction(async (tx) => {
      await printJobRepository.markFailed(tx, jobId, errorMessage);
    });
    console.error(`[Print Job] Job ${jobId} failed:`, errorMessage);
    // Không throw để không làm sập ứng dụng
  }
}