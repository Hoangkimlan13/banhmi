"use server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

export async function getOrderHistory(dateStr?: string) {
  const session = await getStoreSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Nếu không truyền ngày, lấy ngày hiện tại theo giờ Nhật Bản (JST)
  const targetDateStr =
    dateStr ||
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());

  // Xác định khoảng thời gian từ 00:00:00 đến 23:59:59 của ngày đó theo JST
  const startOfDay = new Date(`${targetDateStr}T00:00:00+09:00`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59+09:00`);

  const orders = await db.tbl_customer_orders.findMany({
    where: {
      store_id: session.storeId,
      created_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      tbl_customer_order_items: {
        include: {
          tbl_customer_order_item_options: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Tính toán số liệu thống kê chi tiết theo trạng thái (dùng `as any` để bỏ lỗi gạch chân TypeScript)
  const totalOrders = orders.length;
  
  const totalRevenue = orders.reduce((sum, order) => {
    const status = order.status as any;
    if (status === "PAID" || status === "COMPLETED") {
      return sum + Number(order.total_amount || 0);
    }
    return sum;
  }, 0);

  // Đếm các trạng thái đơn hàng cụ thể với `as any`
  const paidOrders = orders.filter((o) => {
    const status = o.status as any;
    return status === "PAID" || status === "COMPLETED";
  }).length;

  const waitingOrders = orders.filter((o) => {
    const status = o.status as any;
    return status === "WAITING_PAYMENT";
  }).length;

  const cancelledOrders = orders.filter((o) => {
    const status = o.status as any;
    return status === "CANCELLED" || status === "PAYMENT_FAILED";
  }).length;

  // Serialize BigInt cho client component
  const serializedOrders = JSON.parse(
    JSON.stringify(orders, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );

  return {
    orders: serializedOrders,
    stats: {
      totalOrders,
      totalRevenue,
      paidOrders,
      waitingOrders,
      cancelledOrders,
    },
    selectedDate: targetDateStr,
  };
}