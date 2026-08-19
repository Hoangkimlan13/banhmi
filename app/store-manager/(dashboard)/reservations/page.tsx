import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

import ReservationsClient from "./ReservationsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getStartOfTodayJST(): Date {
  const now = new Date();

  const jstDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(now);

  return new Date(
    `${jstDate}T00:00:00+09:00`
  );
}

async function getReservationsFromDB() {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
      return [];
    }

    const reservations = await db.tbl_customer_orders.findMany({
      where: {
        store_id: session.storeId,
        order_type: {
          in: ["SCHEDULED_TIME", "SCHEDULED_DATE"],
        },
        scheduled_for: {
          gte: getStartOfTodayJST(),
        },
      },
      // Thêm phần include các bảng liên quan ở đây
      include: {
        tbl_customer_order_items: {
          include: {
            tbl_customer_order_item_options: true,
          },
        },
      },
      orderBy: [
        { scheduled_for: "asc" },
        { id: "asc" },
      ],
    });

    return reservations.map((item) => ({
      id: Number(item.id),
      order_number: item.order_number != null ? String(item.order_number) : null,
      customer_name: item.customer_name ?? null,
      customer_phone: item.customer_phone ?? null,
      scheduled_for: item.scheduled_for ?? null,
      status: item.status != null ? String(item.status) : "",
      total_amount: item.total_amount != null ? Number(item.total_amount) : 0,
      cancel_reason: item.cancel_reason ?? null,
      created_at: item.created_at ?? null,
      order_type: item.order_type != null ? String(item.order_type) : "",
      
      // Map lại mảng item và options để khớp với type ReservationItem đã khai báo
      tbl_customer_order_items: item.tbl_customer_order_items?.map((subItem) => ({
        id: subItem.id,
        quantity: subItem.quantity,
        price_at_time: subItem.price_at_time ? Number(subItem.price_at_time) : 0,
        food_name_snap: subItem.food_name_snap,
        food_name_ja_snap: subItem.food_name_ja_snap,
        note: subItem.note,
        tbl_customer_order_item_options: subItem.tbl_customer_order_item_options?.map((opt) => ({
          id: opt.id,
          group_name_snap: opt.group_name_snap,
          group_name_ja_snap: opt.group_name_ja_snap,
          option_name_snap: opt.option_name_snap,
          option_name_ja_snap: opt.option_name_ja_snap,
          price_snap: opt.price_snap ? Number(opt.price_snap) : 0,
        })),
      })) || [],
    }));
  } catch (error) {
    console.error("Database error:", error);
    return [];
  }
}

export default async function ReservationsPage() {
  const initialReservations =
    await getReservationsFromDB();

  return (
    <ReservationsClient
      initialReservations={
        initialReservations
      }
    />
  );
}