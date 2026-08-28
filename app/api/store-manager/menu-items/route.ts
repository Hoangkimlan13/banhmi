import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

/* ============================================================
   TYPES
   ============================================================ */

type MenuItemPayload = {
  id?: number;
  menu_id?: number;
  category_id?: number;
  name_ja?: string | null;
  name_vi?: string | null;
  name_en?: string | null;
  name_zh?: string | null;
  description_ja?: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  description_zh?: string | null;
  price?: number | string;
  image_url?: string | null;
  is_available?: boolean;
  status?: "ACTIVE" | "PAUSED" | "DISCONTINUED";
  move?: "up" | "down";
};

/* ============================================================
   HELPERS
   ============================================================ */

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result || null;
}

function parsePositiveInt(value: unknown): number | null {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return null;
  return number;
}

function parsePrice(value: unknown): number | null {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return number;
}

function parseBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

/* ============================================================
   POST – CREATE MENU ITEM
   ============================================================ */

export async function POST(request: NextRequest) {
  try {
    const session = await getStoreSession();
    if (!session?.storeId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as MenuItemPayload;

    const menuId = parsePositiveInt(body.menu_id);
    const categoryId = parsePositiveInt(body.category_id);
    const nameJa = cleanString(body.name_ja);
    const price = parsePrice(body.price);

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: "menu_idが正しくありません。" },
        { status: 400 }
      );
    }
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "カテゴリを選択してください。" },
        { status: 400 }
      );
    }
    if (!nameJa) {
      return NextResponse.json(
        { success: false, error: "商品名を入力してください。" },
        { status: 400 }
      );
    }
    if (price === null) {
      return NextResponse.json(
        { success: false, error: "価格を正しく入力してください。" },
        { status: 400 }
      );
    }

    const menu = await db.tbl_menu.findFirst({
      where: { id: menuId, store_id: session.storeId, is_active: true },
      select: { id: true },
    });
    if (!menu) {
      return NextResponse.json(
        { success: false, error: "このメニューにアクセスできません。" },
        { status: 403 }
      );
    }

    const category = await db.tbl_menu_category.findFirst({
      where: { id: categoryId, menu_id: menuId, is_active: true },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "選択したカテゴリが正しくありません。" },
        { status: 400 }
      );
    }

    // Lấy display_order lớn nhất hiện tại để thêm mới vào cuối
    const maxOrder = await db.tbl_menu_item.aggregate({
      where: { category_id: categoryId, menu_id: menuId },
      _max: { display_order: true },
    });
    const nextOrder = (maxOrder._max.display_order ?? 0) + 1;

    const item = await db.tbl_menu_item.create({
      data: {
        menu_id: menuId,
        category_id: categoryId,
        name_ja: nameJa,
        name_vi: cleanString(body.name_vi),
        name_en: cleanString(body.name_en),
        name_zh: cleanString(body.name_zh),
        description_ja: cleanString(body.description_ja),
        description_vi: cleanString(body.description_vi),
        description_en: cleanString(body.description_en),
        description_zh: cleanString(body.description_zh),
        price,
        image_url: cleanString(body.image_url),
        status: "ACTIVE",
        display_order: nextOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        item: {
          ...item,
          price: item.price.toString(),
          is_available: item.status === "ACTIVE",
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Menu Item POST API]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "商品を保存できません。",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH – UPDATE MENU ITEM
   ============================================================ */

export async function PATCH(request: NextRequest) {
  try {
    const session = await getStoreSession();
    if (!session?.storeId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as MenuItemPayload;
    const itemId = parsePositiveInt(body.id);

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "商品IDが正しくありません。" },
        { status: 400 }
      );
    }

    const existingItem = await db.tbl_menu_item.findFirst({
      where: {
        id: itemId,
        tbl_menu: { store_id: session.storeId },
      },
      select: {
        id: true,
        menu_id: true,
        category_id: true,
        status: true,
        display_order: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: "商品が見つかりません。" },
        { status: 404 }
      );
    }

    // ----------------------------------------------------------
    // 0) REORDER (move up/down)
    // ----------------------------------------------------------
    if (body.move !== undefined) {
      const direction = body.move;
      if (direction !== "up" && direction !== "down") {
        return NextResponse.json(
          { success: false, error: "無効な移動方向です。" },
          { status: 400 }
        );
      }

      const currentOrder = existingItem.display_order ?? 0;

      // Tìm item lân cận
      const adjacent = await db.tbl_menu_item.findFirst({
        where: {
          category_id: existingItem.category_id,
          menu_id: existingItem.menu_id,
          id: { not: itemId },
          display_order: direction === "up" ? { lt: currentOrder } : { gt: currentOrder },
        },
        orderBy: {
          display_order: direction === "up" ? "desc" : "asc",
        },
        select: { id: true, display_order: true },
      });

      if (!adjacent) {
        return NextResponse.json(
          {
            success: false,
            error:
              direction === "up" ? "これ以上上に移動できません。" : "これ以上下に移動できません。",
          },
          { status: 400 }
        );
      }

      // Hoán đổi display_order
      await db.$transaction([
        db.tbl_menu_item.update({
          where: { id: itemId },
          data: { display_order: adjacent.display_order },
        }),
        db.tbl_menu_item.update({
          where: { id: adjacent.id },
          data: { display_order: currentOrder },
        }),
      ]);

      // 🔥 Đánh số lại toàn bộ item trong category để display_order liên tục
      const allItemsInCategory = await db.tbl_menu_item.findMany({
        where: {
          category_id: existingItem.category_id,
          menu_id: existingItem.menu_id,
        },
        orderBy: { display_order: 'asc' },
        select: { id: true },
      });

      const updatePromises = allItemsInCategory.map((item, index) =>
        db.tbl_menu_item.update({
          where: { id: item.id },
          data: { display_order: index + 1 },
        })
      );
      await db.$transaction(updatePromises);

      // Lấy toàn bộ items đã được sắp xếp lại để trả về
      const finalItems = await db.tbl_menu_item.findMany({
        where: {
          category_id: existingItem.category_id,
          menu_id: existingItem.menu_id,
        },
        orderBy: { display_order: 'asc' },
      });

      return NextResponse.json({
        success: true,
        items: finalItems.map(item => ({
          ...item,
          price: item.price.toString(),
          is_available: item.status === "ACTIVE",
        })),
      });
    }

    // ----------------------------------------------------------
    // 1) AVAILABILITY TOGGLE (is_available が送信された場合)
    // ----------------------------------------------------------
    if (body.is_available !== undefined) {
      const isAvailable = parseBoolean(body.is_available);
      if (isAvailable === null) {
        return NextResponse.json(
          { success: false, error: "販売状態が正しくありません。" },
          { status: 400 }
        );
      }

      if (isAvailable) {
        const updated = await db.tbl_menu_item.update({
          where: { id: itemId },
          data: { status: "ACTIVE" },
        });
        return NextResponse.json({
          success: true,
          item: {
            ...updated,
            price: updated.price.toString(),
            is_available: true,
          },
        });
      } else {
        if (existingItem.status === "DISCONTINUED") {
          return NextResponse.json(
            { success: false, error: "販売終了した商品は一時停止できません。" },
            { status: 400 }
          );
        }
        const updated = await db.tbl_menu_item.update({
          where: { id: itemId },
          data: { status: "PAUSED" },
        });
        return NextResponse.json({
          success: true,
          item: {
            ...updated,
            price: updated.price.toString(),
            is_available: false,
          },
        });
      }
    }

    // ----------------------------------------------------------
    // 2) STATUS UPDATE (is_available なしで status が送信された場合)
    // ----------------------------------------------------------
    if (body.status !== undefined) {
      const newStatus = body.status;
      if (!["ACTIVE", "PAUSED", "DISCONTINUED"].includes(newStatus)) {
        return NextResponse.json(
          { success: false, error: "無効なステータスです。" },
          { status: 400 }
        );
      }

      if (existingItem.status === newStatus) {
        const unchanged = await db.tbl_menu_item.findUnique({
          where: { id: itemId },
        });
        return NextResponse.json({
          success: true,
          item: {
            ...unchanged,
            price: unchanged!.price.toString(),
            is_available: unchanged!.status === "ACTIVE",
          },
        });
      }

      const updated = await db.tbl_menu_item.update({
        where: { id: itemId },
        data: { status: newStatus },
      });

      return NextResponse.json({
        success: true,
        item: {
          ...updated,
          price: updated.price.toString(),
          is_available: updated.status === "ACTIVE",
        },
      });
    }

    // ----------------------------------------------------------
    // 3) FULL UPDATE (menu_id, category_id, name_ja, price, ... が必須)
    // ----------------------------------------------------------
    const menuId = parsePositiveInt(body.menu_id);
    const categoryId = parsePositiveInt(body.category_id);
    const nameJa = cleanString(body.name_ja);
    const price = parsePrice(body.price);

    if (!menuId) {
      return NextResponse.json(
        { success: false, error: "menu_idが正しくありません。" },
        { status: 400 }
      );
    }
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "カテゴリを選択してください。" },
        { status: 400 }
      );
    }
    if (!nameJa) {
      return NextResponse.json(
        { success: false, error: "商品名を入力してください。" },
        { status: 400 }
      );
    }
    if (price === null) {
      return NextResponse.json(
        { success: false, error: "価格を正しく入力してください。" },
        { status: 400 }
      );
    }

    const menu = await db.tbl_menu.findFirst({
      where: { id: menuId, store_id: session.storeId, is_active: true },
      select: { id: true },
    });
    if (!menu) {
      return NextResponse.json(
        { success: false, error: "このメニューにアクセスできません。" },
        { status: 403 }
      );
    }

    const category = await db.tbl_menu_category.findFirst({
      where: { id: categoryId, menu_id: menuId, is_active: true },
      select: { id: true },
    });
    if (!category) {
      return NextResponse.json(
        { success: false, error: "選択したカテゴリが正しくありません。" },
        { status: 400 }
      );
    }

    if (Number(existingItem.menu_id) !== menuId) {
      return NextResponse.json(
        { success: false, error: "この商品は指定されたメニューに属していません。" },
        { status: 403 }
      );
    }

    const updated = await db.tbl_menu_item.update({
      where: { id: itemId },
      data: {
        category_id: categoryId,
        name_ja: nameJa,
        name_vi: cleanString(body.name_vi),
        name_en: cleanString(body.name_en),
        name_zh: cleanString(body.name_zh),
        description_ja: cleanString(body.description_ja),
        description_vi: cleanString(body.description_vi),
        description_en: cleanString(body.description_en),
        description_zh: cleanString(body.description_zh),
        price,
        image_url: cleanString(body.image_url),
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...updated,
        price: updated.price.toString(),
        is_available: updated.status === "ACTIVE",
      },
    });
  } catch (error: unknown) {
    console.error("[Menu Item PATCH API]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "商品を更新できません。",
      },
      { status: 500 }
    );
  }
}