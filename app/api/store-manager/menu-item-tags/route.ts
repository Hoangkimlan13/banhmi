import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";

/* ============================================================
   TYPES
   ============================================================ */

type TagId = number;

/* ============================================================
   GET
   Lấy toàn bộ tag + tag đang được gắn với menu item
   ============================================================ */

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const itemIdParam =
      searchParams.get("itemId");

    const itemId = Number(
      itemIdParam
    );

    if (
      !itemIdParam ||
      !Number.isInteger(itemId) ||
      itemId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "商品IDが正しくありません。",
        },
        { status: 400 }
      );
    }

    /* ==========================================================
       Lấy tag đang được chọn
       ========================================================== */

    const selectedRelations =
      await db.tbl_menu_item_tag.findMany({
        where: {
          menu_item_id: itemId,
        },

        select: {
          tag_id: true,
        },
      });

    /* ==========================================================
       Lấy toàn bộ tag đang active
       ========================================================== */

    const tags =
      await db.tbl_tag.findMany({
        where: {
          is_active: 1,
        },

        orderBy: [
          {
            sort_order: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          name_ja: true,
          name_vi: true,
          name_en: true,
          name_zh: true,
          code: true,
          color: true,
          icon: true,
          sort_order: true,
          is_active: true,
        },
      });

    /* ==========================================================
       Selected tag IDs
       ========================================================== */

    const selectedTagIds: TagId[] =
      selectedRelations.map(
        (relation) =>
          Number(relation.tag_id)
      );

    /* ==========================================================
       Response
       ========================================================== */

    return NextResponse.json({
      tags,
      selectedTagIds,
    });
  } catch (error) {
    console.error(
      "[GET /api/store-manager/menu-item-tags]",
      error
    );

    return NextResponse.json(
      {
        error:
          "タグ情報の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PUT
   Lưu tag cho menu item
   ============================================================ */

export async function PUT(
  request: Request
) {
  try {
    const body =
      await request.json();

    /* ==========================================================
       Menu item ID
       ========================================================== */

    const itemId = Number(
      body?.itemId
    );

    if (
      !Number.isInteger(itemId) ||
      itemId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "商品IDが正しくありません。",
        },
        { status: 400 }
      );
    }

    /* ==========================================================
       Raw tag IDs
       ========================================================== */

    const rawTagIds: unknown =
      body?.tagIds;

    const tagIds: TagId[] =
      Array.isArray(rawTagIds)
        ? rawTagIds
            .map(
              (value: unknown) =>
                Number(value)
            )
            .filter(
              (
                id: number
              ): id is number =>
                Number.isInteger(id) &&
                id > 0
            )
        : [];

    /* ==========================================================
       Kiểm tra menu item tồn tại
       ========================================================== */

    const menuItem =
      await db.tbl_menu_item.findUnique({
        where: {
          id: itemId,
        },

        select: {
          id: true,
        },
      });

    if (!menuItem) {
      return NextResponse.json(
        {
          error:
            "商品が見つかりません。",
        },
        { status: 404 }
      );
    }

    /* ==========================================================
       Loại duplicate tag
       ========================================================== */

    const uniqueTagIds: TagId[] =
      Array.from(
        new Set<number>(
          tagIds
        )
      );

    /* ==========================================================
       Kiểm tra tag có tồn tại + active
       ========================================================== */

    if (
      uniqueTagIds.length > 0
    ) {
      const validTags =
        await db.tbl_tag.findMany({
          where: {
            id: {
              in: uniqueTagIds,
            },

            is_active: 1,
          },

          select: {
            id: true,
          },
        });

      /* ========================================================
         Tạo Set ID hợp lệ
         ======================================================== */

      const validTagIdSet =
        new Set<number>(
          validTags.map(
            (tag) =>
              Number(tag.id)
          )
        );

      /* ========================================================
         Tìm tag không hợp lệ
         ======================================================== */

      const invalidTagIds: number[] =
        uniqueTagIds.filter(
          (id: number) =>
            !validTagIdSet.has(id)
        );

      if (
        invalidTagIds.length > 0
      ) {
        return NextResponse.json(
          {
            error:
              "無効なタグが含まれています。",
          },
          { status: 400 }
        );
      }
    }

    /* ==========================================================
       Transaction
       Xóa cũ → tạo mới
       ========================================================== */

    await db.$transaction(
      async (tx) => {
        /* ------------------------------------------------------
           Xóa toàn bộ tag cũ
           ------------------------------------------------------ */

        await tx.tbl_menu_item_tag.deleteMany(
          {
            where: {
              menu_item_id: itemId,
            },
          }
        );

        /* ------------------------------------------------------
           Tạo tag mới
           ------------------------------------------------------ */

        if (
          uniqueTagIds.length > 0
        ) {
          await tx.tbl_menu_item_tag.createMany(
            {
              data:
                uniqueTagIds.map(
                  (tagId: number) => ({
                    menu_item_id:
                      itemId,

                    tag_id:
                      tagId,
                  })
                ),
            }
          );
        }
      }
    );

    /* ==========================================================
       Response
       ========================================================== */

    return NextResponse.json({
      success: true,
      tagIds: uniqueTagIds,
    });
  } catch (error) {
    console.error(
      "[PUT /api/store-manager/menu-item-tags]",
      error
    );

    return NextResponse.json(
      {
        error:
          "タグの保存に失敗しました。",
      },
      { status: 500 }
    );
  }
}