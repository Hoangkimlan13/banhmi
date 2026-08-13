import { Prisma } from '@prisma/client';

import { printJobRepository } from '@/repositories/print-job.repository';

type DbClient =
  | Prisma.TransactionClient
  | Prisma.DefaultPrismaClient;

/**
 * Tạo job in bếp cho order.
 *
 * Không tự tạo job nếu order chưa PAID.
 *
 * Hàm này được gọi từ webhook
 * sau khi Payment đã SUCCESS và Order đã PAID.
 */
export async function createKitchenPrintJob(
  tx: DbClient,
  data: {
    orderId: bigint;
    storeId: number;
  }
) {
  const result =
    await printJobRepository.createKitchenJobIfNotExists(
      tx,
      {
        orderId: data.orderId,
        storeId: data.storeId,
      }
    );

  if (result.created) {
    console.log(
      '[Print Job] Kitchen print job created',
      {
        jobId: result.job.id.toString(),
        orderId: data.orderId.toString(),
        storeId: data.storeId,
        status: result.job.status,
      }
    );
  } else {
    console.log(
      '[Print Job] Kitchen print job already exists',
      {
        jobId: result.job.id.toString(),
        orderId: data.orderId.toString(),
        status: result.job.status,
      }
    );
  }

  return result;
}