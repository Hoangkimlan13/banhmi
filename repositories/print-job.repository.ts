import { Prisma } from '@prisma/client';

type DbClient =
  | Prisma.TransactionClient
  | Prisma.DefaultPrismaClient;

type PrintJobType = 'KITCHEN' | 'CUSTOMER';
type PrintJobStatus =
  | 'WAITING'
  | 'PRINTING'
  | 'PRINTED'
  | 'FAILED';

/**
 * ============================================================
 * CREATE PRINT JOB
 * ============================================================
 */
async function createPrintJob(
  tx: DbClient,
  data: {
    orderId: bigint;
    storeId: number;
    jobType?: PrintJobType;
  }
) {
  return tx.tbl_print_jobs.create({
    data: {
      order_id: data.orderId,
      store_id: data.storeId,

      // Nếu không truyền thì mặc định in bếp
      job_type: data.jobType ?? 'KITCHEN',

      // Job mới luôn bắt đầu ở WAITING
      status: 'WAITING',

      retry_count: 0,
    },
  });
}

/**
 * ============================================================
 * FIND PRINT JOB
 * ============================================================
 *
 * Tìm job theo:
 *
 * order_id + job_type
 *
 * Schema có:
 *
 * @@unique([order_id, job_type])
 *
 * nhưng vẫn dùng findFirst để không phụ thuộc
 * vào tên compound unique được Prisma generate.
 */
async function findPrintJob(
  tx: DbClient,
  orderId: bigint,
  jobType: PrintJobType
) {
  return tx.tbl_print_jobs.findFirst({
    where: {
      order_id: orderId,
      job_type: jobType,
    },

    orderBy: {
      created_at: 'desc',
    },
  });
}

/**
 * ============================================================
 * FIND PRINT JOB BY ID
 * ============================================================
 */
async function findPrintJobById(
  tx: DbClient,
  jobId: bigint
) {
  return tx.tbl_print_jobs.findUnique({
    where: {
      id: jobId,
    },
  });
}

/**
 * ============================================================
 * CREATE KITCHEN JOB IF NOT EXISTS
 * ============================================================
 *
 * Stripe webhook gọi hàm này sau khi:
 *
 * PAYMENT = SUCCESS
 * ORDER   = PAID
 *
 * Sau đó:
 *
 * tbl_print_jobs
 *      ↓
 * KITCHEN
 *      ↓
 * WAITING
 */
async function createKitchenJobIfNotExists(
  tx: DbClient,
  data: {
    orderId: bigint;
    storeId: number;
  }
) {
  const existing = await findPrintJob(
    tx,
    data.orderId,
    'KITCHEN'
  );

  /**
   * Stripe có thể gửi webhook nhiều lần.
   *
   * Nếu job đã tồn tại:
   * → KHÔNG tạo job thứ hai.
   */
  if (existing) {
    console.log(
      '[PrintJob] KITCHEN job already exists',
      {
        orderId: data.orderId.toString(),
        jobId: existing.id.toString(),
        storeId: existing.store_id,
        status: existing.status,
        retryCount: existing.retry_count,
      }
    );

    return {
      created: false,
      job: existing,
    };
  }

  /**
   * Chưa có job → tạo mới.
   */
  const job = await createPrintJob(tx, {
    orderId: data.orderId,
    storeId: data.storeId,
    jobType: 'KITCHEN',
  });

  console.log(
    '[PrintJob] KITCHEN job created',
    {
      orderId: data.orderId.toString(),
      jobId: job.id.toString(),
      storeId: data.storeId,
      jobType: job.job_type,
      status: job.status,
    }
  );

  return {
    created: true,
    job,
  };
}

/**
 * ============================================================
 * FIND WAITING JOBS
 * ============================================================
 *
 * Worker sử dụng hàm này.
 *
 * Lấy các job:
 *
 * status = WAITING
 *
 * và lấy job cũ trước.
 */
async function findWaitingJobs(
  tx: DbClient,
  limit = 20
) {
  return tx.tbl_print_jobs.findMany({
    where: {
      status: 'WAITING',
    },

    orderBy: {
      created_at: 'asc',
    },

    take: limit,
  });
}

/**
 * ============================================================
 * FIND WAITING JOBS BY STORE
 * ============================================================
 *
 * Dùng khi mỗi cửa hàng có printer riêng.
 */
async function findWaitingJobsByStore(
  tx: DbClient,
  storeId: number,
  limit = 20
) {
  return tx.tbl_print_jobs.findMany({
    where: {
      store_id: storeId,
      status: 'WAITING',
    },

    orderBy: {
      created_at: 'asc',
    },

    take: limit,
  });
}

/**
 * ============================================================
 * MARK PRINTING
 * ============================================================
 *
 * WAITING
 *    ↓
 * PRINTING
 *
 * Worker gọi hàm này ngay trước khi bắt đầu in.
 */
async function markPrinting(
  tx: DbClient,
  jobId: bigint
) {
  return tx.tbl_print_jobs.update({
    where: {
      id: jobId,
    },

    data: {
      status: 'PRINTING',
    },
  });
}

/**
 * ============================================================
 * MARK PRINTED
 * ============================================================
 *
 * PRINTING
 *    ↓
 * PRINTED
 *
 * Chỉ gọi sau khi máy in báo in thành công.
 */
async function markPrinted(
  tx: DbClient,
  jobId: bigint
) {
  return tx.tbl_print_jobs.update({
    where: {
      id: jobId,
    },

    data: {
      status: 'PRINTED',
      printed_at: new Date(),
      last_error: null,
    },
  });
}

/**
 * ============================================================
 * MARK FAILED
 * ============================================================
 *
 * PRINTING
 *    ↓
 * FAILED
 *
 * Schema của bạn dùng:
 *
 * last_error
 *
 * KHÔNG phải:
 *
 * error_message
 */
async function markFailed(
  tx: DbClient,
  jobId: bigint,
  errorMessage?: string
) {
  const job = await tx.tbl_print_jobs.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error(
      `Print job ${jobId.toString()} not found`
    );
  }

  return tx.tbl_print_jobs.update({
    where: {
      id: jobId,
    },

    data: {
      status: 'FAILED',

      retry_count: {
        increment: 1,
      },

      last_error:
        errorMessage ?? null,
    },
  });
}

/**
 * ============================================================
 * RETRY PRINT JOB
 * ============================================================
 *
 * FAILED
 *    ↓
 * WAITING
 *
 * Worker có thể lấy lại job này.
 */
async function retryPrintJob(
  tx: DbClient,
  jobId: bigint
) {
  return tx.tbl_print_jobs.update({
    where: {
      id: jobId,
    },

    data: {
      status: 'WAITING',
      last_error: null,
    },
  });
}

/**
 * ============================================================
 * RESET STUCK PRINTING JOB
 * ============================================================
 *
 * Nếu worker crash trong lúc:
 *
 * PRINTING
 *
 * job có thể bị kẹt.
 *
 * Hàm này đưa nó về:
 *
 * WAITING
 */
async function resetPrintingJob(
  tx: DbClient,
  jobId: bigint
) {
  return tx.tbl_print_jobs.update({
    where: {
      id: jobId,
    },

    data: {
      status: 'WAITING',
    },
  });
}

/**
 * ============================================================
 * EXPORT
 * ============================================================
 */
export const printJobRepository = {
  createPrintJob,

  findPrintJob,
  findPrintJobById,

  createKitchenJobIfNotExists,

  findWaitingJobs,
  findWaitingJobsByStore,

  markPrinting,
  markPrinted,
  markFailed,

  retryPrintJob,
  resetPrintingJob,
};