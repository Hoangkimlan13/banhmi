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

function cleanInt(value: unknown, fallback = 0): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.trunc(number);
}

function normalizeType(value: unknown): "single" | "multiple" {
  return value === "multiple" ? "multiple" : "single";
}

function normalizeMaxChoices(type: "single" | "multiple", value: unknown): number {
  if (type === "single") return 1;
  const number = cleanInt(value, 2);
  return Math.max(2, number);
}

// ============================================================
// GET OPTION GROUPS
// ============================================================

export async function getOptionGroups(menuId: number) {
  try {
    const groups = await db.tbl_menu_option_groups.findMany({
      where: { menu_id: menuId },
      orderBy: { sort_order: "asc" },
      include: {
        tbl_menu_option_items: {
          orderBy: { sort_order: "asc" },
        },
        _count: {
          select: { tbl_menu_item_option_groups: true },
        },
      },
    });

    const data = groups.map((g) => ({
      ...g,
      items: g.tbl_menu_option_items,
      usage_count: g._count.tbl_menu_item_option_groups,
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getOptionGroups error:", error);
    return { success: false, message: "Failed to fetch option groups" };
  }
}

// ============================================================
// CREATE OPTION GROUP
// ============================================================

export async function createOptionGroup(input: {
  menu_id: number;
  code: string;
  name_ja: string;
  name_vi?: string;
  name_en?: string;
  name_zh?: string;
  description?: string;
  sort_order?: number;
  is_available?: boolean;
  is_required?: boolean;
  type?: "single" | "multiple";
  max_choices?: number;
}) {
  try {
    const menuId = Number(input.menu_id);
    if (!Number.isInteger(menuId) || menuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const menu = await db.tbl_menu.findUnique({
      where: { id: menuId },
      select: { id: true },
    });
    if (!menu) {
      return { success: false, message: "指定されたメニューが見つかりません。" };
    }

    const code = cleanString(input.code).toUpperCase();
    const nameJa = cleanString(input.name_ja);

    if (!code) return { success: false, message: "コードを入力してください。" };
    if (!nameJa) return { success: false, message: "日本語名を入力してください。" };
    if (code.length > 50) return { success: false, message: "コードは50文字以内で入力してください。" };

    const existing = await db.tbl_menu_option_groups.findUnique({
      where: { code },
      select: { id: true },
    });
    if (existing) {
      return { success: false, message: `コード「${code}」は既に使用されています。` };
    }

    const lastGroup = await db.tbl_menu_option_groups.findFirst({
      where: { menu_id: menuId },
      orderBy: { sort_order: "desc" },
      select: { sort_order: true },
    });
    const sortOrder = input.sort_order !== undefined
      ? cleanInt(input.sort_order, 0)
      : (lastGroup?.sort_order ?? 0) + 1;

    const type = normalizeType(input.type);
    const isRequired = Boolean(input.is_required);
    const maxChoices = normalizeMaxChoices(type, input.max_choices);

    await db.tbl_menu_option_groups.create({
      data: {
        menu_id: menuId,
        code,
        name_ja: nameJa,
        name_vi: cleanNullableString(input.name_vi),
        name_en: cleanNullableString(input.name_en),
        name_zh: cleanNullableString(input.name_zh),
        description: cleanNullableString(input.description),
        sort_order: sortOrder,
        is_available: input.is_available ?? true,
        is_required: isRequired,
        type,
        max_choices: maxChoices,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    revalidatePath(OPTIONS_PATH);
    return { success: true, message: "オプショングループを作成しました。" };
  } catch (error) {
    console.error("createOptionGroup error:", error);
    return { success: false, message: "オプショングループの作成に失敗しました。" };
  }
}

// ============================================================
// UPDATE OPTION GROUP
// ============================================================

export async function updateOptionGroup(input: {
  id: number;
  code: string;
  name_ja: string;
  name_vi?: string;
  name_en?: string;
  name_zh?: string;
  description?: string;
  sort_order?: number;
  is_available?: boolean;
  is_required?: boolean;
  type?: "single" | "multiple";
  max_choices?: number;
}) {
  try {
    const id = Number(input.id);
    if (!Number.isInteger(id) || id <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }

    const existingGroup = await db.tbl_menu_option_groups.findUnique({
      where: { id },
      select: { id: true, menu_id: true, code: true, sort_order: true },
    });
    if (!existingGroup) {
      return { success: false, message: "オプショングループが見つかりません。" };
    }

    const menuId = existingGroup.menu_id;

    const code = cleanString(input.code).toUpperCase();
    const nameJa = cleanString(input.name_ja);

    if (!code) return { success: false, message: "コードを入力してください。" };
    if (!nameJa) return { success: false, message: "日本語名を入力してください。" };
    if (code.length > 50) return { success: false, message: "コードは50文字以内で入力してください。" };

    // Check usage count để biết có cho phép sửa code không
    const usageCount = await db.tbl_menu_item_option_groups.count({
      where: { option_group_id: id },
    });

    if (usageCount > 0 && code !== existingGroup.code.toUpperCase()) {
      return {
        success: false,
        message: "このオプショングループは商品で使用されているため、コードを変更できません。",
      };
    }

    if (code !== existingGroup.code) {
      const duplicate = await db.tbl_menu_option_groups.findUnique({
        where: { code },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== id) {
        return { success: false, message: `コード「${code}」は既に使用されています。` };
      }
    }

    const sortOrder = input.sort_order !== undefined
      ? cleanInt(input.sort_order, existingGroup.sort_order)
      : existingGroup.sort_order;

    const type = normalizeType(input.type);
    const isRequired = Boolean(input.is_required);
    const maxChoices = normalizeMaxChoices(type, input.max_choices);

    await db.tbl_menu_option_groups.update({
      where: { id },
      data: {
        code,
        name_ja: nameJa,
        name_vi: cleanNullableString(input.name_vi),
        name_en: cleanNullableString(input.name_en),
        name_zh: cleanNullableString(input.name_zh),
        description: cleanNullableString(input.description),
        sort_order: sortOrder,
        is_available: input.is_available ?? true,
        is_required: isRequired,
        type,
        max_choices: maxChoices,
        updated_at: new Date(),
      },
    });

    revalidatePath(OPTIONS_PATH);
    return { success: true, message: "オプショングループを更新しました。" };
  } catch (error) {
    console.error("updateOptionGroup error:", error);
    return { success: false, message: "オプショングループの更新に失敗しました。" };
  }
}

// ============================================================
// TOGGLE OPTION GROUP
// ============================================================

export async function toggleOptionGroup(id: number, menuId: number, isAvailable: boolean) {
  try {
    const groupId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const group = await db.tbl_menu_option_groups.findFirst({
      where: { id: groupId, menu_id: currentMenuId },
      select: { id: true },
    });
    if (!group) {
      return { success: false, message: "オプショングループが見つかりません。" };
    }

    await db.tbl_menu_option_groups.update({
      where: { id: groupId },
      data: { is_available: Boolean(isAvailable), updated_at: new Date() },
    });

    revalidatePath(OPTIONS_PATH);
    return {
      success: true,
      message: isAvailable ? "オプショングループを有効にしました。" : "オプショングループを無効にしました。",
    };
  } catch (error) {
    console.error("toggleOptionGroup error:", error);
    return { success: false, message: "状態の変更に失敗しました。" };
  }
}

// ============================================================
// MOVE OPTION GROUP
// ============================================================

export async function moveOptionGroup(id: number, menuId: number, direction: "UP" | "DOWN") {
  try {
    const groupId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }
    if (direction !== "UP" && direction !== "DOWN") {
      return { success: false, message: "不正な移動方向です。" };
    }

    const currentGroup = await db.tbl_menu_option_groups.findFirst({
      where: { id: groupId, menu_id: currentMenuId },
      select: { id: true, sort_order: true },
    });
    if (!currentGroup) {
      return { success: false, message: "オプショングループが見つかりません。" };
    }

    const targetGroup = direction === "UP"
      ? await db.tbl_menu_option_groups.findFirst({
          where: { menu_id: currentMenuId, sort_order: { lt: currentGroup.sort_order } },
          orderBy: { sort_order: "desc" },
          select: { id: true, sort_order: true },
        })
      : await db.tbl_menu_option_groups.findFirst({
          where: { menu_id: currentMenuId, sort_order: { gt: currentGroup.sort_order } },
          orderBy: { sort_order: "asc" },
          select: { id: true, sort_order: true },
        });

    if (!targetGroup) {
      return {
        success: false,
        message: direction === "UP" ? "これ以上上へ移動できません。" : "これ以上下へ移動できません。",
      };
    }

    await db.$transaction([
      db.tbl_menu_option_groups.update({
        where: { id: currentGroup.id },
        data: { sort_order: targetGroup.sort_order, updated_at: new Date() },
      }),
      db.tbl_menu_option_groups.update({
        where: { id: targetGroup.id },
        data: { sort_order: currentGroup.sort_order, updated_at: new Date() },
      }),
    ]);

    revalidatePath(OPTIONS_PATH);
    return {
      success: true,
      message: direction === "UP" ? "オプショングループを上へ移動しました。" : "オプショングループを下へ移動しました。",
    };
  } catch (error) {
    console.error("moveOptionGroup error:", error);
    return { success: false, message: "オプショングループの並び順変更に失敗しました。" };
  }
}

// ============================================================
// DELETE OPTION GROUP
// ============================================================

export async function deleteOptionGroup(id: number, menuId: number) {
  try {
    const groupId = Number(id);
    const currentMenuId = Number(menuId);
    if (!Number.isInteger(groupId) || groupId <= 0) {
      return { success: false, message: "不正なグループIDです。" };
    }
    if (!Number.isInteger(currentMenuId) || currentMenuId <= 0) {
      return { success: false, message: "不正なメニューIDです。" };
    }

    const group = await db.tbl_menu_option_groups.findFirst({
      where: { id: groupId, menu_id: currentMenuId },
      select: { id: true },
    });
    if (!group) {
      return { success: false, message: "オプショングループが見つかりません。" };
    }

    const usageCount = await db.tbl_menu_item_option_groups.count({
      where: { option_group_id: groupId },
    });
    if (usageCount > 0) {
      return {
        success: false,
        message: "このオプショングループは商品で使用されているため削除できません。無効化してください。",
      };
    }

    await db.tbl_menu_option_groups.delete({
      where: { id: groupId },
    });

    revalidatePath(OPTIONS_PATH);
    return { success: true, message: "オプショングループを削除しました。" };
  } catch (error) {
    console.error("deleteOptionGroup error:", error);
    return { success: false, message: "オプショングループの削除に失敗しました。" };
  }
}