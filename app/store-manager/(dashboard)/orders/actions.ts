"use server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách đơn hàng của cửa hàng (Chỉ lấy trong ngày hôm nay theo giờ Nhật Bản - JST)
export async function getStoreOrders() {
  const session = await getStoreSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Lấy ngày hiện tại chuẩn JST
  const now = new Date();
  const jstDateStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(now);

  // Tạo mốc 00:00:00 của ngày hôm nay theo giờ JST
  const startOfDayJST = new Date(`${jstDateStr}T00:00:00+09:00`);

  const orders = await db.tbl_customer_orders.findMany({
    where: {
      store_id: session.storeId,
      created_at: {
        gte: startOfDayJST,
      },
    },
    include: {
      tbl_customer_order_items: {
        include: {
          tbl_menu_item: true,

          tbl_customer_order_item_options: {
            orderBy: {
              id: "asc",
            },
          },
        },
      },

      tbl_print_jobs: {
        orderBy: {
          created_at: "desc",
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Serialize BigInt cho client component
  return JSON.parse(
    JSON.stringify(orders, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

// 2. Lấy trạng thái hoạt động của quán từ tbl_store
export async function getStoreStatus() {
  const session = await getStoreSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const store = await db.tbl_store.findUnique({
    where: { id: session.storeId },
    select: {
      id: true,
      title: true,
      accepting_orders: true,
      order_status_date: true,
      order_stop_reason: true,
      order_stopped_at: true,
      order_reopen_at: true,
    },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  const todayStr = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
  }).format(new Date());

  let storedDateStr = null;
  if (store.order_status_date) {
    storedDateStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date(store.order_status_date));
  }

  if (storedDateStr && storedDateStr !== todayStr && store.accepting_orders === false) {
    await db.tbl_store.update({
      where: { id: session.storeId },
      data: {
        accepting_orders: true,
        order_status_date: new Date(`${todayStr}T00:00:00.000Z`),
        order_stop_reason: null,
        order_stopped_at: null,
        order_reopen_at: null,
      },
    });

    return {
      ...store,
      accepting_orders: true,
      order_status_date: new Date(`${todayStr}T00:00:00.000Z`),
      order_stop_reason: null,
      order_stopped_at: null,
      order_reopen_at: null,
    };
  }

  return store;
}

// 3. Bật / Tắt trạng thái nhận đơn trực tiếp trên tbl_store
export async function toggleStoreOrders(acceptingOrders: boolean, reason?: string) {
  const session = await getStoreSession();
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const todayStr = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
    }).format(new Date());

    await db.tbl_store.update({
      where: { id: session.storeId },
      data: acceptingOrders
        ? {
            accepting_orders: true,
            order_status_date: new Date(todayStr),
            order_stop_reason: null,
            order_stopped_at: null,
            order_reopen_at: new Date(),
          }
        : {
            accepting_orders: false,
            order_status_date: new Date(todayStr),
            order_stop_reason: reason || "混雑のため一時停止",
            order_stopped_at: new Date(),
            order_reopen_at: null,
          },
    });

    revalidatePath("/store-manager/orders");
    return { success: true };
  } catch (error) {
    console.error("TOGGLE STORE ORDERS ERROR:", error);
    return { success: false, message: "店舗状態の更新に失敗しました。" };
  }
}

// 4. In lại hóa đơn hoặc phiếu bếp (jobType nhận 'KITCHEN' hoặc 'CUSTOMER')
export async function reprintOrderBill(orderIdStr: string, jobIdStr?: string, jobType: string = "CUSTOMER") {
  const session = await getStoreSession();
  if (!session) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const orderId = BigInt(orderIdStr);

    // Kiểm tra xem đã có print job nào cho order_id và job_type này chưa
    const existingJob = await db.tbl_print_jobs.findFirst({
      where: {
        order_id: orderId,
        job_type: jobType as any,
      },
    });

    if (existingJob) {
      // Nếu đã có, cập nhật lại trạng thái về WAITING để hệ thống in tiếp tục quét và in lại
      await db.tbl_print_jobs.update({
        where: { id: existingJob.id },
        data: {
          status: "WAITING",
          retry_count: 0,
          last_error: null,
          created_at: new Date(), // Cập nhật thời gian để đưa lên đầu hàng đợi
        },
      });
    } else {
      // Nếu chưa có, tạo mới bản ghi in
      await db.tbl_print_jobs.create({
        data: {
          order_id: orderId,
          store_id: session.storeId,
          job_type: jobType as any,
          status: "WAITING",
          retry_count: 0,
        },
      });
    }

    revalidatePath("/store-manager/orders");
    return { success: true, message: "印刷キューに追加しました。(再印刷)" };
  } catch (error) {
    console.error("REPRINT ERROR:", error);
    return { success: false, message: "エラーが発生しました。" };
  }
}