import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/prisma";

/* ============================================================
   GET
   ============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    const menuItemId =
      Number(
        request.nextUrl.searchParams.get(
          "menuItemId"
        )
      );

    if (
      !Number.isInteger(menuItemId) ||
      menuItemId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "menuItemIdが正しくありません。",
        },
        { status: 400 }
      );
    }

    const variants =
      await db.tbl_menu_item_variants.findMany({
        where: {
          menu_item_id:
            menuItemId,

          deleted_at: null,
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

    return NextResponse.json({
      success: true,

      variants,
    });
  } catch (error) {
    console.error(
      "[GET variants]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "サイズ情報の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   POST
   ============================================================ */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const menuItemId =
      Number(
        body.menu_item_id
      );

    const code =
      String(
        body.code ?? ""
      ).trim();

    const nameJa =
      String(
        body.name_ja ?? ""
      ).trim();

    const price =
      Number(
        body.price ?? 0
      );

    const isDefault =
      Boolean(
        body.is_default
      );

    if (
      !Number.isInteger(
        menuItemId
      ) ||
      menuItemId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "商品IDが正しくありません。",
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "コードを入力してください。",
        },
        { status: 400 }
      );
    }

    if (!nameJa) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズ名を入力してください。",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "価格が正しくありません。",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       CHECK ITEM
       ======================================================== */

    const item =
      await db.tbl_menu_item.findUnique({
        where: {
          id: menuItemId,
        },
        select: {
          id: true,
        },
      });

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error:
            "商品が見つかりません。",
        },
        { status: 404 }
      );
    }

    /* ========================================================
       CHECK CODE
       ======================================================== */

    const duplicate =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          menu_item_id:
            menuItemId,

          code,

          deleted_at: null,
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "このコードはすでに使用されています。",
        },
        { status: 409 }
      );
    }

    /* ========================================================
       SORT ORDER
       ======================================================== */

    const lastVariant =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          menu_item_id:
            menuItemId,

          deleted_at: null,
        },

        orderBy: {
          sort_order: "desc",
        },

        select: {
          sort_order: true,
        },
      });

    const sortOrder =
      (lastVariant?.sort_order ??
        -1) + 1;

    /* ========================================================
       CREATE
       ======================================================== */

    const variant =
      await db.$transaction(
        async (tx) => {
          if (isDefault) {
            await tx.tbl_menu_item_variants.updateMany(
              {
                where: {
                  menu_item_id:
                    menuItemId,

                  deleted_at: null,
                },

                data: {
                  is_default:
                    false,
                },
              }
            );
          }

          return tx.tbl_menu_item_variants.create(
            {
              data: {
                menu_item_id:
                  menuItemId,

                code,

                sku:
                  body.sku
                    ? String(
                        body.sku
                      ).trim()
                    : null,

                name_ja:
                  nameJa,

                name_vi:
                  body.name_vi
                    ? String(
                        body.name_vi
                      ).trim()
                    : null,

                name_en:
                  body.name_en
                    ? String(
                        body.name_en
                      ).trim()
                    : null,

                name_zh:
                  body.name_zh
                    ? String(
                        body.name_zh
                      ).trim()
                    : null,

                price,

                is_default:
                  isDefault,

                is_available:
                  true,

                sort_order:
                  sortOrder,
              },
            }
          );
        }
      );

    return NextResponse.json({
      success: true,

      variant,
    });
  } catch (error: any) {
    console.error(
      "[POST variant]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "サイズの追加に失敗しました。",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   PATCH
   ============================================================ */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズIDが正しくありません。",
        },
        { status: 400 }
      );
    }

    const existing =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          id,

          deleted_at: null,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズが見つかりません。",
        },
        { status: 404 }
      );
    }

    /* ========================================================
       TOGGLE ONLY
       ======================================================== */

    if (
      typeof body.is_available ===
      "boolean" &&
      body.code === undefined
    ) {
      const variant =
        await db.tbl_menu_item_variants.update(
          {
            where: {
              id,
            },

            data: {
              is_available:
                body.is_available,
            },
          }
        );

      return NextResponse.json({
        success: true,

        variant,
      });
    }

    /* ========================================================
       UPDATE
       ======================================================== */

    const code =
      String(
        body.code ??
          existing.code
      ).trim();

    const nameJa =
      String(
        body.name_ja ??
          existing.name_ja
      ).trim();

    const price =
      Number(
        body.price ??
          existing.price
      );

    const isDefault =
      Boolean(
        body.is_default ??
          existing.is_default
      );

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "コードを入力してください。",
        },
        { status: 400 }
      );
    }

    if (!nameJa) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズ名を入力してください。",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "価格が正しくありません。",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       DUPLICATE CODE
       ======================================================== */

    const duplicate =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          menu_item_id:
            existing.menu_item_id,

          code,

          id: {
            not: id,
          },

          deleted_at: null,
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "このコードはすでに使用されています。",
        },
        { status: 409 }
      );
    }

    /* ========================================================
       UPDATE TRANSACTION
       ======================================================== */

    const variant =
      await db.$transaction(
        async (tx) => {
          if (isDefault) {
            await tx.tbl_menu_item_variants.updateMany(
              {
                where: {
                  menu_item_id:
                    existing.menu_item_id,

                  id: {
                    not: id,
                  },

                  deleted_at: null,
                },

                data: {
                  is_default:
                    false,
                },
              }
            );
          }

          return tx.tbl_menu_item_variants.update(
            {
              where: {
                id,
              },

              data: {
                code,

                sku:
                  body.sku !==
                  undefined
                    ? body.sku
                      ? String(
                          body.sku
                        ).trim()
                      : null
                    : existing.sku,

                name_ja:
                  nameJa,

                name_vi:
                  body.name_vi !==
                  undefined
                    ? body.name_vi
                      ? String(
                          body.name_vi
                        ).trim()
                      : null
                    : existing.name_vi,

                name_en:
                  body.name_en !==
                  undefined
                    ? body.name_en
                      ? String(
                          body.name_en
                        ).trim()
                      : null
                    : existing.name_en,

                name_zh:
                  body.name_zh !==
                  undefined
                    ? body.name_zh
                      ? String(
                          body.name_zh
                        ).trim()
                      : null
                    : existing.name_zh,

                price,

                is_default:
                  isDefault,

                ...(typeof body.is_available ===
                "boolean"
                  ? {
                      is_available:
                        body.is_available,
                    }
                  : {}),
              },
            }
          );
        }
      );

    return NextResponse.json({
      success: true,

      variant,
    });
  } catch (error) {
    console.error(
      "[PATCH variant]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "サイズの更新に失敗しました。",
      },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE
   ============================================================ */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズIDが正しくありません。",
        },
        { status: 400 }
      );
    }

    const variant =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          id,

          deleted_at: null,
        },
      });

    if (!variant) {
      return NextResponse.json(
        {
          success: false,
          error:
            "サイズが見つかりません。",
        },
        { status: 404 }
      );
    }

    await db.tbl_menu_item_variants.update(
      {
        where: {
          id,
        },

        data: {
          deleted_at:
            new Date(),

          is_available:
            false,

          is_default:
            false,
        },
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "[DELETE variant]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "サイズの削除に失敗しました。",
      },
      { status: 500 }
    );
  }
}