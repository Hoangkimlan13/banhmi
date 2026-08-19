"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

import type { ReservationStatus } from "./reservation.types";

export async function updateReservationStatus(
  orderId: number,
  newStatus: ReservationStatus
) {
  try {
    // ============================================================
    // STORE SESSION
    // ============================================================

    const session = await getStoreSession();

    if (!session) {
      return {
        success: false,
        message: "店舗ログイン情報がありません。",
      };
    }

    const storeId = session.storeId;

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return {
        success: false,
        message: "店舗情報が不正です。",
      };
    }

    // ============================================================
    // FIND RESERVATION
    // ============================================================

    const order =
      await db.tbl_customer_orders.findFirst({
        where: {
          id: orderId,
          store_id: storeId,
        },

        select: {
          id: true,
          status: true,
          order_type: true,
        },
      });

    if (!order) {
      return {
        success: false,
        message: "予約情報が見つかりません。",
      };
    }

    // ============================================================
    // CHECK ORDER TYPE
    // ============================================================

    if (
      order.order_type !==
        "SCHEDULED_TIME" &&
      order.order_type !==
        "SCHEDULED_DATE"
    ) {
      return {
        success: false,
        message:
          "この注文は予約注文ではありません。",
      };
    }

    // ============================================================
    // UPDATE STATUS
    // ============================================================

    await db.tbl_customer_orders.update({
      where: {
        id: orderId,
      },

      data: {
        status: newStatus as any,
        updated_at: new Date(),
      },
    });

    console.log(
      `[Server Action] Reservation ${orderId} -> ${newStatus}`
    );

    // ============================================================
    // REVALIDATE
    // ============================================================

    revalidatePath(
      "/store-manager/reservations"
    );

    return {
      success: true,
      message:
        "予約ステータスを更新しました。",
    };
  } catch (error) {
    console.error(
      "[updateReservationStatus] Failed:",
      error
    );

    return {
      success: false,
      message:
        "ステータスの更新に失敗しました。",
    };
  }
}