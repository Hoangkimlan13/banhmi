"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

const OPTIONS_PATH = "/store-manager/options";

// ============================================================
// HELPERS
// ============================================================

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown): string | null {
  const text = cleanString(value);
  return text === "" ? null : text;
}

function cleanPrice(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.round(number * 100) / 100;
}

// ============================================================
// GET OPTION ITEMS (cho một group)
// ============================================================

export async function getOptionItems(groupId: number) {
  try {
    const items = await db.tbl_menu_option_items.findMany({
      where: { option_group_id: groupId },
      orderBy: { sort_order: "asc" },
      include: {
        _count: {
          select: { tbl_menu_item_option_items: true },
        },
      },
    });
    const data = items.map((item) => ({
      ...item,
      usage_count: item._count.tbl_menu_item_option_items,
    }));
    return { success: true, data };
  } catch (error) {
    console.error("getOptionItems error:", error);
    return { success: false, message: "Failed to fetch option items" };
  }
}

// ============================================================
// CREATE OPTION ITEM
// ============================================================

export async function createOptionItem(input: {
  menu_id: number;
  option_group_id: number;
  code: string;
  name_ja: string;
  name_vi?: string;
  name_en?: string;
  name_zh?: string;
  icon_url?: string;
  price?: string | number;
  is_available?: boolean;
}) {
  try {
    const menuId = Number(input.menu_id);
    const groupId = Number(input.option_group_id);

    if (!Number.isInteger(menuId) || menuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }

    const group = await db.tbl_menu_option_groups.findFirst({
      where: { id: groupId, menu_id: menuId },
      select: { id: true },
    });
    if (!group) {
      return { success: false, message: "指定されたメニューのオプショングループが見つかりません。" };
    }

    const code = cleanString(input.code).toUpperCase();
    const nameJa = cleanString(input.name_ja);

    if (!code) return { success: false, message: "コードを入力してください。" };
    if (!nameJa) return { success: false, message: "日本語名を入力してください。" };
    if (code.length > 50) return { success: false, message: "コードは50文字以内で入力してください。" };

    const existing = await db.tbl_menu_option_items.findFirst({
      where: { option_group_id: groupId, code },
      select: { id: true },
    });
    if (existing) {
      return { success: false, message: `このグループではコード「${code}」は既に使用されています。` };
    }

    const lastItem = await db.tbl_menu_option_items.findFirst({
      where: { option_group_id: groupId },
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    });
    const nextSortOrder = lastItem ? lastItem.sort_order + 1 : 0;

    const price = cleanPrice(input.price);

    const item = await db.tbl_menu_option_items.create({
      data: {
        option_group_id: groupId,
        code,
        name_ja: nameJa,
        name_vi: cleanNullableString(input.name_vi),
        name_en: cleanNullableString(input.name_en),
        name_zh: cleanNullableString(input.name_zh),
        icon_url: cleanNullableString(input.icon_url),
        price,
        sort_order: nextSortOrder,
        is_available: input.is_available ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath(OPTIONS_PATH);
    return {
      success: true,
      message: "オプションを作成しました。",
      data: { id: item.id, sort_order: item.sort_order },
    };
  } catch (error) {
    console.error("createOptionItem error:", error);
    return { success: false, message: "オプションの作成に失敗しました。" };
  }
}

// ============================================================
// UPDATE OPTION ITEM
// ============================================================

export async function updateOptionItem(input: {
  id: number;
  menu_id: number;
  option_group_id: number;
  code: string;
  name_ja: string;
  name_vi?: string;
  name_en?: string;
  name_zh?: string;
  icon_url?: string;
  price?: string | number;
  is_available?: boolean;
}) {
  try {
    const id = Number(input.id);
    const menuId = Number(input.menu_id);
    const groupId = Number(input.option_group_id);

    if (!Number.isInteger(id) || id <= 0) {
      return { success: false, message: "不正なオプションIDです。" };
    }
    if (!Number.isInteger(menuId) || menuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }

    const existing = await db.tbl_menu_option_items.findFirst({
      where: {
        id,
        option_group_id: groupId,
        tbl_menu_option_groups: { menu_id: menuId },
      },
      select: { id: true, sort_order: true },
    });
    if (!existing) {
      return { success: false, message: "指定されたメニューのオプションが見つかりません。" };
    }

    const code = cleanString(input.code).toUpperCase();
    const nameJa = cleanString(input.name_ja);

    if (!code) return { success: false, message: "コードを入力してください。" };
    if (!nameJa) return { success: false, message: "日本語名を入力してください。" };
    if (code.length > 50) return { success: false, message: "コードは50文字以内で入力してください。" };

    const duplicate = await db.tbl_menu_option_items.findFirst({
      where: { option_group_id: groupId, code, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      return { success: false, message: `このグループではコード「${code}」は既に使用されています。` };
    }

    const price = cleanPrice(input.price);

    await db.tbl_menu_option_items.update({
      where: { id },
      data: {
        code,
        name_ja: nameJa,
        name_vi: cleanNullableString(input.name_vi),
        name_en: cleanNullableString(input.name_en),
        name_zh: cleanNullableString(input.name_zh),
        icon_url: cleanNullableString(input.icon_url),
        price,
        is_available: input.is_available ?? true,
        updated_at: new Date(),
      },
    });

    revalidatePath(OPTIONS_PATH);
    return { success: true, message: "オプションを更新しました。" };
  } catch (error) {
    console.error("updateOptionItem error:", error);
    return { success: false, message: "オプションの更新に失敗しました。" };
  }
}

// ============================================================
// MOVE OPTION ITEM
// ============================================================

export async function moveOptionItem(id: number, menuId: number, direction: "UP" | "DOWN") {
  try {
    const itemId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return { success: false, message: "不正なオプションIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const current = await db.tbl_menu_option_items.findFirst({
      where: {
        id: itemId,
        tbl_menu_option_groups: { menu_id: currentMenuId },
      },
      select: { id: true, option_group_id: true, sort_order: true },
    });
    if (!current) {
      return { success: false, message: "オプションが見つかりません。" };
    }

    const currentSort = current.sort_order;

    let target;
    if (direction === "UP") {
      target = await db.tbl_menu_option_items.findFirst({
        where: { option_group_id: current.option_group_id, sort_order: { lt: currentSort } },
        orderBy: { sort_order: "desc" },
        select: { id: true, sort_order: true },
      });
    } else {
      target = await db.tbl_menu_option_items.findFirst({
        where: { option_group_id: current.option_group_id, sort_order: { gt: currentSort } },
        orderBy: { sort_order: "asc" },
        select: { id: true, sort_order: true },
      });
    }

    if (!target) {
      return {
        success: false,
        message: direction === "UP" ? "これ以上上に移動できません。" : "これ以上下に移動できません。",
      };
    }

    const targetSort = target.sort_order;
    const temporarySort = -(Math.max(Math.abs(currentSort), Math.abs(targetSort), 1000000) + 1);

    await db.$transaction(async (tx) => {
      await tx.tbl_menu_option_items.update({
        where: { id: current.id },
        data: { sort_order: temporarySort, updated_at: new Date() },
      });
      await tx.tbl_menu_option_items.update({
        where: { id: target.id },
        data: { sort_order: currentSort, updated_at: new Date() },
      });
      await tx.tbl_menu_option_items.update({
        where: { id: current.id },
        data: { sort_order: targetSort, updated_at: new Date() },
      });
    });

    revalidatePath(OPTIONS_PATH);
    return {
      success: true,
      message: direction === "UP" ? "上に移動しました。" : "下に移動しました。",
    };
  } catch (error) {
    console.error("moveOptionItem error:", error);
    return { success: false, message: "表示順の変更に失敗しました。" };
  }
}

// ============================================================
// TOGGLE OPTION ITEM
// ============================================================

export async function toggleOptionItem(id: number, menuId: number, isAvailable: boolean) {
  try {
    const itemId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return { success: false, message: "不正なオプションIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const item = await db.tbl_menu_option_items.findFirst({
      where: {
        id: itemId,
        tbl_menu_option_groups: { menu_id: currentMenuId },
      },
      select: { id: true },
    });
    if (!item) {
      return { success: false, message: "オプションが見つかりません。" };
    }

    await db.tbl_menu_option_items.update({
      where: { id: itemId },
      data: { is_available: Boolean(isAvailable), updated_at: new Date() },
    });

    revalidatePath(OPTIONS_PATH);
    return {
      success: true,
      message: isAvailable ? "オプションを有効にしました。" : "オプションを無効にしました。",
    };
  } catch (error) {
    console.error("toggleOptionItem error:", error);
    return { success: false, message: "状態の変更に失敗しました。" };
  }
}

// ============================================================
// DELETE OPTION ITEM
// ============================================================

export async function deleteOptionItem(id: number, menuId: number) {
  try {
    const itemId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return { success: false, message: "不正なオプションIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const item = await db.tbl_menu_option_items.findFirst({
      where: {
        id: itemId,
        tbl_menu_option_groups: { menu_id: currentMenuId },
      },
      select: { id: true },
    });
    if (!item) {
      return { success: false, message: "オプションが見つかりません。" };
    }

    // Kiểm tra usage_count
    const usageCount = await db.tbl_menu_item_option_items.count({
      where: { option_item_id: itemId },
    });
    if (usageCount > 0) {
      return {
        success: false,
        message: "このオプションは商品で使用されているため削除できません。無効化してください。",
      };
    }

    await db.tbl_menu_option_items.delete({
      where: { id: itemId },
    });

    revalidatePath(OPTIONS_PATH);
    return { success: true, message: "オプションを削除しました。" };
  } catch (error) {
    console.error("deleteOptionItem error:", error);
    return { success: false, message: "オプションの削除に失敗しました。" };
  }
}