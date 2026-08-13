import { db } from '@/lib/prisma';

export async function allocateOrderNumber(
  tx: typeof db,
  storeId: number
): Promise<number> {
  const now = new Date();

  // Lấy ngày theo timezone của server.
  // Nếu server của bạn chạy UTC nhưng business ở Nhật,
  // nên cấu hình timezone/JST rõ ràng ở production.
  const orderDate = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );

  // Tạo counter nếu ngày/store này chưa có.
  await tx.$executeRaw`
    INSERT INTO tbl_daily_order_numbers
      (store_id, order_date, last_number)
    VALUES
      (${storeId}, ${orderDate}, 299)
    ON DUPLICATE KEY UPDATE
      id = id
  `;

  // Lock row để chống 2 khách lấy cùng một số.
  const rows = await tx.$queryRaw<
    Array<{
      id: bigint;
      last_number: number;
    }>
  >`
    SELECT id, last_number
    FROM tbl_daily_order_numbers
    WHERE store_id = ${storeId}
      AND order_date = ${orderDate}
    FOR UPDATE
  `;

  if (!rows.length) {
    throw new Error('Failed to allocate daily order number');
  }

  const nextNumber = Number(rows[0].last_number) + 1;

  if (nextNumber > 999) {
    throw new Error(
      `Daily order number limit exceeded for store ${storeId}`
    );
  }

  await tx.$executeRaw`
    UPDATE tbl_daily_order_numbers
    SET last_number = ${nextNumber}
    WHERE id = ${rows[0].id}
  `;

  return nextNumber;
}