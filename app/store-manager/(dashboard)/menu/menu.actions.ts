"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

export async function updateMenuItemAvailability(
  itemId: number,
  isAvailable: boolean
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

    const storeId = Number(session.storeId);

    if (!Number.isInteger(storeId) || storeId <= 0) {
      return {
        success: false,
        message: "店舗情報が不正です。",
      };
    }

    // ============================================================
    // VALIDATE ITEM
    // ============================================================

    const item = await db.tbl_menu_item.findFirst({
      where: {
        id: itemId,
        store_id: storeId,
      },
      select: {
        id: true,
        store_id: true,
        name_ja: true,
        is_available: true,
      },
    });

    if (!item) {
      return {
        success: false,
        message: "商品が見つかりません。",
      };
    }

    // ============================================================
    // UPDATE
    // ============================================================

    await db.tbl_menu_item.update({
      where: {
        id: itemId,
      },
      data: {
        is_available: isAvailable,
      },
    });

    console.log(
      `[Menu Manager] Item ${itemId} (${item.name_ja}) -> ${
        isAvailable ? "AVAILABLE" : "SOLD_OUT"
      }`
    );

    // ============================================================
    // REVALIDATE
    // ============================================================

    revalidatePath("/store-manager/menu");

    return {
      success: true,
      isAvailable,
      message: isAvailable
        ? "販売を再開しました。"
        : "売り切れに設定しました。",
    };
  } catch (error) {
    console.error("[updateMenuItemAvailability] Failed:", error);

    return {
      success: false,
      message: "商品の状態更新に失敗しました。",
    };
  }
}