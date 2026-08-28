import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// GET
// ============================================================

export async function GET(request: Request) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
      return NextResponse.json(
        {
          error: "店舗ログイン情報がありません。",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const itemId = Number(
      searchParams.get("itemId")
    );

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        {
          error: "商品IDが不正です。",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // 商品がこの店舗に属しているか確認
    // --------------------------------------------------------

    const item =
      await db.tbl_menu_item.findFirst({
        where: {
          id: itemId,
          tbl_menu: {
            store_id: session.storeId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!item) {
      return NextResponse.json(
        {
          error: "商品が見つかりません。",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // Active allergen
    // --------------------------------------------------------

    const allergens =
      await db.tbl_allergen.findMany({
        where: {
          is_active: true,
        },
        orderBy: [
          {
            sort_order: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    // --------------------------------------------------------
    // Selected allergen
    // --------------------------------------------------------

    const selected =
      await db.tbl_menu_item_allergen.findMany({
        where: {
          menu_item_id: itemId,
        },
        select: {
          allergen_id: true,
        },
      });

    return NextResponse.json({
      allergens,
      selectedAllergenIds: selected.map(
        (row) => Number(row.allergen_id)
      ),
    });
  } catch (error) {
    console.error(
      "[menu-item-allergens GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "アレルゲン情報の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT
// ============================================================

export async function PUT(request: Request) {
  try {
    const session = await getStoreSession();

    if (!session?.storeId) {
      return NextResponse.json(
        {
          error: "店舗ログイン情報がありません。",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const itemId = Number(body.itemId);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        {
          error: "商品IDが不正です。",
        },
        { status: 400 }
      );
    }

    const allergenIds: number[] = Array.isArray(body.allergenIds)
    ? Array.from(
        new Set(
          body.allergenIds
            .map((value: unknown) => Number(value))
            .filter(
              (id: number): id is number =>
                Number.isInteger(id) && id > 0
            )
        )
      )
    : [];

    // --------------------------------------------------------
    // 商品確認
    // --------------------------------------------------------

    const item =
      await db.tbl_menu_item.findFirst({
        where: {
          id: itemId,
          tbl_menu: {
            store_id: session.storeId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!item) {
      return NextResponse.json(
        {
          error: "商品が見つかりません。",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // Save
    // --------------------------------------------------------

    await db.$transaction(async (tx) => {
      // 既存設定を削除
      await tx.tbl_menu_item_allergen.deleteMany({
        where: {
          menu_item_id: itemId,
        },
      });

      if (allergenIds.length === 0) {
        return;
      }

      // 存在する active allergen のみ取得
      const validAllergens =
        await tx.tbl_allergen.findMany({
          where: {
            id: {
              in: allergenIds,
            },
            is_active: true,
          },
          select: {
            id: true,
          },
        });

      if (validAllergens.length === 0) {
        return;
      }

      // 新しい設定を登録
      await tx.tbl_menu_item_allergen.createMany({
        data: validAllergens.map((allergen) => ({
          menu_item_id: itemId,
          allergen_id: allergen.id,
        })),
        skipDuplicates: true,
      });
    });

    return NextResponse.json({
      success: true,
      allergenIds,
    });
  } catch (error) {
    console.error(
      "[menu-item-allergens PUT]",
      error
    );

    return NextResponse.json(
      {
        error:
          "アレルゲンの保存に失敗しました。",
      },
      { status: 500 }
    );
  }
}