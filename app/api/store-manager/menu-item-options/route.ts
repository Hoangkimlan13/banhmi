import {
  NextRequest,
  NextResponse,
} from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

/* ============================================================
   TYPES
   ============================================================ */

type VariantPriceInput = {
  option_item_id: number;
  variant_id: number;
  price: number;
};

type SaveOptionsPayload = {
  menu_item_id: number;
  option_group_ids: number[];
  option_item_ids: number[];
  variant_prices: VariantPriceInput[];
};

/* ============================================================
   HELPERS
   ============================================================ */

function parsePositiveInt(
  value: unknown
): number | null {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function parseIdArray(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

function parseVariantPrices(
  value: unknown
): VariantPriceInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const map =
    new Map<
      string,
      VariantPriceInput
    >();

  for (const row of value) {
    if (
      !row ||
      typeof row !== "object"
    ) {
      continue;
    }

    const data =
      row as Record<
        string,
        unknown
      >;

    const optionItemId =
      Number(
        data.option_item_id
      );

    const variantId =
      Number(
        data.variant_id
      );

    const price =
      Number(data.price);

    if (
      !Number.isInteger(
        optionItemId
      ) ||
      optionItemId <= 0
    ) {
      continue;
    }

    if (
      !Number.isInteger(
        variantId
      ) ||
      variantId <= 0
    ) {
      continue;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      continue;
    }

    const key =
      `${optionItemId}_${variantId}`;

    map.set(key, {
      option_item_id:
        optionItemId,

      variant_id:
        variantId,

      price,
    });
  }

  return Array.from(
    map.values()
  );
}

/* ============================================================
   GET
   ============================================================ */

export async function GET(
  request: NextRequest
) {
  try {
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const menuItemId =
      parsePositiveInt(
        request.nextUrl.searchParams.get(
          "menu_item_id"
        )
      );

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "menu_item_idが正しくありません。",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VERIFY MENU ITEM
       ======================================================== */

    const menuItem =
      await db.tbl_menu_item.findFirst(
        {
          where: {
            id: menuItemId,

            tbl_menu: {
              store_id:
                session.storeId,

              is_active: true,
            },
          },

          select: {
            id: true,
            menu_id: true,
          },
        }
      );

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          error:
            "この商品にアクセスできません。",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       GROUP RELATIONS
       ======================================================== */

    const groupRelations =
      await db.tbl_menu_item_option_groups.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,

            is_available: true,
          },

          select: {
            option_group_id:
              true,
          },

          orderBy: {
            sort_order: "asc",
          },
        }
      );

    /* ========================================================
       ITEM RELATIONS
       ======================================================== */

    const itemRelations =
      await db.tbl_menu_item_option_items.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,

            is_available: true,
          },

          select: {
            option_item_id:
              true,
          },

          orderBy: {
            sort_order: "asc",
          },
        }
      );

    const optionItemIds =
      Array.from(
        new Set(
          itemRelations.map(
            (row) =>
              row.option_item_id
          )
        )
      );

    /* ========================================================
       VARIANTS

       Lấy toàn bộ variant của món.
       Không phụ thuộc option nào đã chọn.
       ======================================================== */

    const variants =
      await db.tbl_menu_item_variants.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,

            deleted_at: null,

            is_available: true,
          },

          select: {
            id: true,
            code: true,
            sku: true,

            name_ja: true,
            name_vi: true,
            name_en: true,
            name_zh: true,

            price: true,

            is_default: true,
            is_available: true,

            stock_status: true,
          },

          orderBy: [
            {
              sort_order:
                "asc",
            },
            {
              id: "asc",
            },
          ],
        }
      );

    /* ========================================================
       VARIANT PRICES
       ======================================================== */

    const variantPrices =
      optionItemIds.length > 0
        ? await db
            .tbl_menu_option_item_variant_prices
            .findMany({
              where: {
                option_item_id: {
                  in:
                    optionItemIds,
                },
              },

              select: {
                option_item_id:
                  true,

                variant_id:
                  true,

                price: true,
              },

              orderBy: [
                {
                  option_item_id:
                    "asc",
                },

                {
                  variant_id:
                    "asc",
                },
              ],
            })
        : [];

    /* ========================================================
       RESPONSE
       ======================================================== */

    const optionGroupIds =
      Array.from(
        new Set(
          groupRelations.map(
            (row) =>
              row.option_group_id
          )
        )
      );

    return NextResponse.json(
      {
        success: true,

        menu_item_id:
          menuItemId,

        option_group_ids:
          optionGroupIds,

        option_item_ids:
          optionItemIds,

        variants:
          variants.map(
            (variant) => ({
              id: variant.id,

              code:
                variant.code,

              sku:
                variant.sku,

              name_ja:
                variant.name_ja,

              name_vi:
                variant.name_vi,

              name_en:
                variant.name_en,

              name_zh:
                variant.name_zh,

              price:
                Number(
                  variant.price
                ),

              is_default:
                variant.is_default,

              is_available:
                variant.is_available,

              stock_status:
                variant.stock_status,
            })
          ),

        variant_prices:
          variantPrices.map(
            (row) => ({
              option_item_id:
                row.option_item_id,

              variant_id:
                row.variant_id,

              price:
                Number(
                  row.price
                ),
            })
          ),
      },

      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "[Menu Item Options GET API]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "オプション設定を取得できません。",
      },

      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PUT
   ============================================================ */

export async function PUT(
  request: NextRequest
) {
  try {
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* ========================================================
       BODY
       ======================================================== */

    const body =
      (await request.json()) as Partial<SaveOptionsPayload>;

    const menuItemId =
      parsePositiveInt(
        body.menu_item_id
      );

    const optionGroupIds =
      parseIdArray(
        body.option_group_ids
      );

    const optionItemIds =
      parseIdArray(
        body.option_item_ids
      );

    const variantPrices =
      parseVariantPrices(
        body.variant_prices
      );

    if (!menuItemId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "menu_item_idが正しくありません。",
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VERIFY MENU ITEM
       ======================================================== */

    const menuItem =
      await db.tbl_menu_item.findFirst(
        {
          where: {
            id: menuItemId,

            tbl_menu: {
              store_id:
                session.storeId,

              is_active: true,
            },
          },

          select: {
            id: true,
            menu_id: true,
          },
        }
      );

    if (!menuItem) {
      return NextResponse.json(
        {
          success: false,
          error:
            "この商品にアクセスできません。",
        },
        {
          status: 403,
        }
      );
    }

    /* ========================================================
       VERIFY GROUPS
       ======================================================== */

    const validGroups =
      optionGroupIds.length > 0
        ? await db.tbl_menu_option_groups.findMany(
            {
              where: {
                id: {
                  in:
                    optionGroupIds,
                },

                menu_id:
                  menuItem.menu_id,

                is_available: true,
              },

              select: {
                id: true,
              },
            }
          )
        : [];

    const validGroupIds =
      new Set(
        validGroups.map(
          (group) =>
            group.id
        )
      );

    const invalidGroupIds =
      optionGroupIds.filter(
        (id) =>
          !validGroupIds.has(
            id
          )
      );

    if (
      invalidGroupIds.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "無効なオプショングループが含まれています。",

          invalid_group_ids:
            invalidGroupIds,
        },

        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VERIFY OPTION ITEMS
       ======================================================== */

    const optionItems =
      optionItemIds.length > 0
        ? await db.tbl_menu_option_items.findMany(
            {
              where: {
                id: {
                  in:
                    optionItemIds,
                },

                is_available:
                  true,
              },

              select: {
                id: true,

                option_group_id:
                  true,
              },
            }
          )
        : [];

    const optionItemMap =
      new Map(
        optionItems.map(
          (item) => [
            item.id,
            item,
          ]
        )
      );

    const invalidOptionItemIds =
      optionItemIds.filter(
        (id) =>
          !optionItemMap.has(
            id
          )
      );

    if (
      invalidOptionItemIds.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "無効なオプション項目が含まれています。",

          invalid_option_item_ids:
            invalidOptionItemIds,
        },

        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VERIFY ITEM -> GROUP
       ======================================================== */

    for (const optionItemId of
      optionItemIds) {
      const optionItem =
        optionItemMap.get(
          optionItemId
        );

      if (!optionItem) {
        continue;
      }

      if (
        !validGroupIds.has(
          optionItem.option_group_id
        )
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "オプション項目とグループの組み合わせが正しくありません。",

            option_item_id:
              optionItemId,

            option_group_id:
              optionItem.option_group_id,
          },

          {
            status: 400,
          }
        );
      }
    }

    /* ========================================================
       VERIFY VARIANTS
       ======================================================== */

    const variantIds =
      Array.from(
        new Set(
          variantPrices.map(
            (row) =>
              row.variant_id
          )
        )
      );

    const variants =
      variantIds.length > 0
        ? await db.tbl_menu_item_variants.findMany(
            {
              where: {
                id: {
                  in:
                    variantIds,
                },

                menu_item_id:
                  menuItemId,

                deleted_at:
                  null,
              },

              select: {
                id: true,
              },
            }
          )
        : [];

    const validVariantIds =
      new Set(
        variants.map(
          (variant) =>
            variant.id
        )
      );

    const invalidVariantIds =
      variantIds.filter(
        (id) =>
          !validVariantIds.has(
            id
          )
      );

    if (
      invalidVariantIds.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "商品に存在しないバリエーションが含まれています。",

          invalid_variant_ids:
            invalidVariantIds,
        },

        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VERIFY VARIANT PRICE OPTION ITEM
       ======================================================== */

    const invalidVariantPriceItems =
      variantPrices.filter(
        (row) =>
          !optionItemMap.has(
            row.option_item_id
          )
      );

    if (
      invalidVariantPriceItems.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "選択されていないオプション項目の価格設定が含まれています。",
        },

        {
          status: 400,
        }
      );
    }

    /* ========================================================
       OLD OPTION ITEMS
       ======================================================== */

    const oldOptionItems =
      await db.tbl_menu_item_option_items.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,
          },

          select: {
            option_item_id:
              true,
          },
        }
      );

    const oldOptionItemIds =
      Array.from(
        new Set(
          oldOptionItems.map(
            (row) =>
              row.option_item_id
          )
        )
      );

    /* ========================================================
       TRANSACTION
       ======================================================== */

    await db.$transaction(
      async (tx) => {
        /* ----------------------------------------------------
           1. DELETE OLD VARIANT PRICES
           ---------------------------------------------------- */

        if (
          oldOptionItemIds.length >
          0
        ) {
          await tx
            .tbl_menu_option_item_variant_prices
            .deleteMany({
              where: {
                option_item_id: {
                  in:
                    oldOptionItemIds,
                },
              },
            });
        }

        /* ----------------------------------------------------
           2. DELETE GROUP RELATIONS
           ---------------------------------------------------- */

        await tx
          .tbl_menu_item_option_groups
          .deleteMany({
            where: {
              menu_item_id:
                menuItemId,
            },
          });

        /* ----------------------------------------------------
           3. DELETE ITEM RELATIONS
           ---------------------------------------------------- */

        await tx
          .tbl_menu_item_option_items
          .deleteMany({
            where: {
              menu_item_id:
                menuItemId,
            },
          });

        /* ----------------------------------------------------
           4. CREATE GROUP RELATIONS
           ---------------------------------------------------- */

        if (
          optionGroupIds.length >
          0
        ) {
          await tx
            .tbl_menu_item_option_groups
            .createMany({
              data:
                optionGroupIds.map(
                  (
                    optionGroupId,
                    index
                  ) => ({
                    menu_item_id:
                      menuItemId,

                    option_group_id:
                      optionGroupId,

                    is_available:
                      true,

                    sort_order:
                      index,
                  })
                ),
            });
        }

        /* ----------------------------------------------------
           5. CREATE ITEM RELATIONS
           ---------------------------------------------------- */

        if (
          optionItemIds.length >
          0
        ) {
          await tx
            .tbl_menu_item_option_items
            .createMany({
              data:
                optionItemIds.map(
                  (
                    optionItemId,
                    index
                  ) => {
                    const optionItem =
                      optionItemMap.get(
                        optionItemId
                      );

                    if (
                      !optionItem
                    ) {
                      throw new Error(
                        `Option item ${optionItemId} not found.`
                      );
                    }

                    return {
                      menu_item_id:
                        menuItemId,

                      option_group_id:
                        optionItem.option_group_id,

                      option_item_id:
                        optionItemId,

                      is_available:
                        true,

                      sort_order:
                        index,
                    };
                  }
                ),
            });
        }

        /* ----------------------------------------------------
           6. CREATE VARIANT PRICES
           ---------------------------------------------------- */

        if (
          variantPrices.length >
          0
        ) {
          await tx
            .tbl_menu_option_item_variant_prices
            .createMany({
              data:
                variantPrices.map(
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

    /* ========================================================
       READ BACK
       ======================================================== */

    const savedGroups =
      await db.tbl_menu_item_option_groups.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,

            is_available: true,
          },

          select: {
            option_group_id:
              true,
          },

          orderBy: {
            sort_order: "asc",
          },
        }
      );

    const savedItems =
      await db.tbl_menu_item_option_items.findMany(
        {
          where: {
            menu_item_id:
              menuItemId,

            is_available: true,
          },

          select: {
            option_item_id:
              true,
          },

          orderBy: {
            sort_order: "asc",
          },
        }
      );

    const savedGroupIds =
      Array.from(
        new Set(
          savedGroups.map(
            (row) =>
              row.option_group_id
          )
        )
      );

    const savedItemIds =
      Array.from(
        new Set(
          savedItems.map(
            (row) =>
              row.option_item_id
          )
        )
      );

    const savedVariantPrices =
      savedItemIds.length > 0
        ? await db
            .tbl_menu_option_item_variant_prices
            .findMany({
              where: {
                option_item_id: {
                  in:
                    savedItemIds,
                },
              },

              select: {
                option_item_id:
                  true,

                variant_id:
                  true,

                price: true,
              },

              orderBy: [
                {
                  option_item_id:
                    "asc",
                },

                {
                  variant_id:
                    "asc",
                },
              ],
            })
        : [];

    /* ========================================================
       RESPONSE
       ======================================================== */

    return NextResponse.json(
      {
        success: true,

        menu_item_id:
          menuItemId,

        option_group_ids:
          savedGroupIds,

        option_item_ids:
          savedItemIds,

        variant_prices:
          savedVariantPrices.map(
            (row) => ({
              option_item_id:
                row.option_item_id,

              variant_id:
                row.variant_id,

              price:
                Number(
                  row.price
                ),
            })
          ),
      },

      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error(
      "[Menu Item Options PUT API]",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "オプションを保存できません。",
      },

      {
        status: 500,
      }
    );
  }
}