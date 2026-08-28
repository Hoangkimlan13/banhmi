import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/prisma";

// ============================================================
// TYPES
// ============================================================

type PriceInput = {
  option_item_id: number;
  variant_id: number;
  price: number;
};

// ============================================================
// GET
// ============================================================

export async function GET(
  request: NextRequest
) {
  try {
    const menuItemIdParam =
      request.nextUrl.searchParams.get(
        "menu_item_id"
      );

    const menuItemId = Number(
      menuItemIdParam
    );

    if (
      !Number.isInteger(menuItemId) ||
      menuItemId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu_item_id",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // Lấy các option item thuộc menu item hiện tại
    //
    // Quan hệ:
    //
    // tbl_menu_item
    //       ↓
    // tbl_menu_item_option_items
    //       ↓
    // tbl_menu_option_items
    //
    // ========================================================

    const optionItems =
      await db.tbl_menu_option_items.findMany({
        where: {
          tbl_menu_item_option_items: {
            some: {
              menu_item_id: menuItemId,
            },
          },
        },

        select: {
          id: true,
        },
      });

    const optionItemIds: number[] =
      optionItems.map(
        (item) => item.id
      );

    // ========================================================
    // Không có option item
    // ========================================================

    if (optionItemIds.length === 0) {
      return NextResponse.json({
        success: true,
        prices: [],
      });
    }

    // ========================================================
    // Lấy giá variant
    // ========================================================

    const rows =
      await db.tbl_menu_option_item_variant_prices.findMany(
        {
          where: {
            option_item_id: {
              in: optionItemIds,
            },
          },

          select: {
            option_item_id: true,
            variant_id: true,
            price: true,
          },

          orderBy: [
            {
              option_item_id: "asc",
            },
            {
              variant_id: "asc",
            },
          ],
        }
      );

    // ========================================================
    // Response
    // ========================================================

    return NextResponse.json({
      success: true,

      prices: rows.map((row) => ({
        option_item_id:
          row.option_item_id,

        variant_id:
          row.variant_id,

        price: Number(row.price),
      })),
    });
  } catch (error) {
    console.error(
      "[OptionVariantPrices][GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "価格情報を取得できませんでした。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT
// ============================================================

export async function PUT(
  request: NextRequest
) {
  try {
    const body = await request.json();

    // ========================================================
    // menu_item_id
    // ========================================================

    const menuItemId = Number(
      body.menu_item_id
    );

    if (
      !Number.isInteger(menuItemId) ||
      menuItemId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid menu_item_id",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // prices
    // ========================================================

    const rawPrices: unknown =
      body.prices;

    const prices: unknown[] =
      Array.isArray(rawPrices)
        ? rawPrices
        : [];

    // ========================================================
    // Normalize prices
    // ========================================================

    const cleanPrices: PriceInput[] =
      prices
        .map((row: unknown) => {
          if (
            typeof row !== "object" ||
            row === null
          ) {
            return null;
          }

          const data =
            row as Record<
              string,
              unknown
            >;

          return {
            option_item_id: Number(
              data.option_item_id
            ),

            variant_id: Number(
              data.variant_id
            ),

            price: Number(
              data.price
            ),
          };
        })
        .filter(
          (
            row
          ): row is PriceInput =>
            row !== null &&
            Number.isInteger(
              row.option_item_id
            ) &&
            row.option_item_id > 0 &&
            Number.isInteger(
              row.variant_id
            ) &&
            row.variant_id > 0 &&
            Number.isFinite(
              row.price
            ) &&
            row.price >= 0
        );

    // ========================================================
    // Kiểm tra menu item tồn tại
    // ========================================================

    const menuItem =
      await db.tbl_menu_item.findUnique({
        where: {
          id: menuItemId,
        },

        select: {
          id: true,
        },
      });

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          error:
            "商品が見つかりません。",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // Lấy option item IDs từ request
    // ========================================================

    const optionItemIds: number[] =
      Array.from(
        new Set(
          cleanPrices.map(
            (row) =>
              row.option_item_id
          )
        )
      );

    // ========================================================
    // Kiểm tra option item thuộc menu item hiện tại
    //
    // tbl_menu_option_items
    //      ↓
    // tbl_menu_item_option_items
    //      ↓
    // menu_item_id
    //
    // ========================================================

    const validOptionItems =
      optionItemIds.length > 0
        ? await db.tbl_menu_option_items.findMany(
            {
              where: {
                id: {
                  in: optionItemIds,
                },

                tbl_menu_item_option_items: {
                  some: {
                    menu_item_id:
                      menuItemId,
                  },
                },
              },

              select: {
                id: true,
              },
            }
          )
        : [];

    // ========================================================
    // Valid option item IDs
    // ========================================================

    const validOptionItemIds: number[] =
      validOptionItems.map(
        (row) => row.id
      );

    const validOptionItemIdSet =
      new Set<number>(
        validOptionItemIds
      );

    // ========================================================
    // Chỉ giữ price của option item hợp lệ
    // ========================================================

    const validPrices =
      cleanPrices.filter(
        (row) =>
          validOptionItemIdSet.has(
            row.option_item_id
          )
      );

    // ========================================================
    // Lấy variant IDs
    // ========================================================

    const variantIds: number[] =
      Array.from(
        new Set(
          validPrices.map(
            (row) =>
              row.variant_id
          )
        )
      );

    // ========================================================
    // Kiểm tra variant thuộc menu item
    // ========================================================

    const validVariants =
      variantIds.length > 0
        ? await db.tbl_menu_item_variants.findMany(
            {
              where: {
                id: {
                  in: variantIds,
                },

                menu_item_id:
                  menuItemId,
              },

              select: {
                id: true,
              },
            }
          )
        : [];

    const validVariantIds: number[] =
      validVariants.map(
        (row) => row.id
      );

    const validVariantIdSet =
      new Set<number>(
        validVariantIds
      );

    // ========================================================
    // Chỉ giữ price có variant hợp lệ
    // ========================================================

    const finalPrices =
      validPrices.filter(
        (row) =>
          validVariantIdSet.has(
            row.variant_id
          )
      );

    // ========================================================
    // TRANSACTION
    // ========================================================

    await db.$transaction(
      async (tx) => {
        // ----------------------------------------------------
        // Xóa giá cũ
        //
        // Chỉ xóa những option item thực sự thuộc
        // menu item hiện tại.
        // ----------------------------------------------------

        if (
          validOptionItemIds.length > 0
        ) {
          await tx
            .tbl_menu_option_item_variant_prices
            .deleteMany({
              where: {
                option_item_id: {
                  in: validOptionItemIds,
                },
              },
            });
        }

        // ----------------------------------------------------
        // Insert giá mới
        // ----------------------------------------------------

        if (
          finalPrices.length > 0
        ) {
          await tx
            .tbl_menu_option_item_variant_prices
            .createMany({
              data:
                finalPrices.map(
                  (row) => ({
                    option_item_id:
                      row.option_item_id,

                    variant_id:
                      row.variant_id,

                    price:
                      row.price,
                  })
                ),
            });
        }
      }
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json({
      success: true,

      prices: finalPrices,
    });
  } catch (error) {
    console.error(
      "[OptionVariantPrices][PUT]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "価格を保存できませんでした。",
      },
      { status: 500 }
    );
  }
}