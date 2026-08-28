"use server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// UPDATE MENU ITEM AVAILABILITY
// ============================================================

export async function updateMenuItemAvailability(
  itemId: number,
  isAvailable: boolean
) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
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

    // Verify item belongs to current store
    const item = await db.tbl_menu_item.findFirst({
      where: {
        id: itemId,
        tbl_menu: { store_id: storeId },
      },
      select: { id: true, status: true },
    });

    if (!item) {
      return {
        success: false,
        message: "商品が見つかりません。",
      };
    }

    // 🔥 Convert boolean isAvailable → status
    // Nếu isAvailable true → ACTIVE, false → PAUSED
    // Lưu ý: Nếu item đang DISCONTINUED và isAvailable true → vẫn cho phép mở lại (ACTIVE)
    const newStatus = isAvailable ? "ACTIVE" : "PAUSED";

    await db.tbl_menu_item.update({
      where: { id: itemId },
      data: { status: newStatus },
    });

    return {
      success: true,
      message: isAvailable ? "販売を再開しました。" : "売り切れにしました。",
    };
  } catch (error) {
    console.error("[updateMenuItemAvailability]", error);
    return {
      success: false,
      message: "商品の状態更新に失敗しました。",
    };
  }
}

// ============================================================
// UPDATE OPTION GROUP AVAILABILITY (không thay đổi)
// ============================================================

export async function updateMenuOptionGroupAvailability(
  optionGroupId: number,
  isAvailable: boolean
) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
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

    const relation = await db.tbl_menu_item_option_groups.findFirst({
      where: {
        option_group_id: optionGroupId,
        tbl_menu_item: {
          tbl_menu: { store_id: storeId },
        },
      },
      select: { option_group_id: true },
    });

    if (!relation) {
      return {
        success: false,
        message: "オプショングループが見つかりません。",
      };
    }

    await db.tbl_menu_option_groups.update({
      where: { id: optionGroupId },
      data: { is_available: isAvailable },
    });

    return {
      success: true,
      message: isAvailable
        ? "オプショングループを有効にしました。"
        : "オプショングループを停止しました。",
    };
  } catch (error) {
    console.error("[updateMenuOptionGroupAvailability]", error);
    return {
      success: false,
      message: "オプショングループの状態更新に失敗しました。",
    };
  }
}

// ============================================================
// UPDATE OPTION ITEM AVAILABILITY (không thay đổi)
// ============================================================

export async function updateMenuOptionItemAvailability(
  optionItemId: number,
  isAvailable: boolean
) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
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

    const option = await db.tbl_menu_option_items.findFirst({
      where: {
        id: optionItemId,
        tbl_menu_option_groups: {
          tbl_menu_item_option_groups: {
            some: {
              tbl_menu_item: {
                tbl_menu: { store_id: storeId },
              },
            },
          },
        },
      },
      select: { id: true },
    });

    if (!option) {
      return {
        success: false,
        message: "オプション項目が見つかりません。",
      };
    }

    await db.tbl_menu_option_items.update({
      where: { id: optionItemId },
      data: { is_available: isAvailable },
    });

    return {
      success: true,
      message: isAvailable
        ? "オプション項目を有効にしました。"
        : "オプション項目を停止しました。",
    };
  } catch (error) {
    console.error("[updateMenuOptionItemAvailability]", error);
    return {
      success: false,
      message: "オプション項目の状態更新に失敗しました。",
    };
  }
}

// ============================================================
// UPDATE CATEGORY AVAILABILITY
// ============================================================

export async function updateMenuCategoryAvailability(
  categoryId: number,
  isAvailable: boolean
) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
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

    const category = await db.tbl_menu_category.findFirst({
      where: {
        id: categoryId,
        tbl_menu: { store_id: storeId },
      },
      select: { id: true, menu_id: true, name_ja: true },
    });

    if (!category) {
      return {
        success: false,
        message: "カテゴリーが見つかりません。",
      };
    }

    // 🔥 Chuyển isAvailable → status
    const newStatus = isAvailable ? "ACTIVE" : "PAUSED";

    const result = await db.tbl_menu_item.updateMany({
      where: {
        menu_id: category.menu_id,
        category_id: categoryId,
      },
      data: { status: newStatus },
    });

    return {
      success: true,
      message: isAvailable
        ? `「${category.name_ja}」の商品販売を再開しました。`
        : `「${category.name_ja}」の商品をすべて売切中にしました。`,
      updatedCount: result.count,
    };
  } catch (error) {
    console.error("[updateMenuCategoryAvailability]", error);
    return {
      success: false,
      message: "カテゴリーの販売状態更新に失敗しました。",
    };
  }
}