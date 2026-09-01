import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const menuItemId = Number(id);

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "vi";

    // ============================================================
    // 1. VALIDATE ID
    // ============================================================

    if (!Number.isInteger(menuItemId) || menuItemId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid menu item id",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. GET MENU ITEM
    // ============================================================

    const food = await db.tbl_menu_item.findFirst({
      where: {
        id: menuItemId,
        status: "ACTIVE",
      },
    });

    if (!food) {
      return NextResponse.json(
        {
          success: false,
          code: "ITEM_NOT_FOUND",
          message: "Menu item not found or inactive",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 3. GET VARIANTS
    //
    // IMPORTANT:
    //
    // variant.price = GIÁ CỦA VARIANT
    //
    // Ví dụ:
    // Regular = 790
    // Mini    = 500
    //
    // Không phải:
    // Regular = +790
    // Mini    = +500
    // ============================================================

    const variants = await db.tbl_menu_item_variants.findMany({
      where: {
        menu_item_id: menuItemId,
        is_available: true,
        deleted_at: null,
      },
      orderBy: {
        sort_order: "asc",
      },
    });

    const variantIds = variants.map((variant) => variant.id);

    // ============================================================
    // 4. GET OPTION GROUP MAPPING
    // ============================================================

    const groups = await db.tbl_menu_item_option_groups.findMany({
      where: {
        menu_item_id: menuItemId,
        is_available: true,
      },
      include: {
        tbl_menu_option_groups: true,
      },
      orderBy: {
        sort_order: "asc",
      },
    });

    // ============================================================
    // 5. GET OPTION ITEMS
    // ============================================================

    const optionGroupIds = groups.map(
      (group) => group.option_group_id
    );

    const options =
      optionGroupIds.length > 0
        ? await db.tbl_menu_option_items.findMany({
            where: {
              option_group_id: {
                in: optionGroupIds,
              },
              is_available: true,
            },
            orderBy: {
              sort_order: "asc",
            },
          })
        : [];

    // ============================================================
    // 6. GET OPTION PRICE BY VARIANT
    //
    // Ví dụ:
    //
    // Regular + Egg = +100
    // Mini + Egg     = +100
    //
    // Hoặc:
    //
    // Regular + Cheese = +250
    // Mini + Cheese     = +200
    //
    // Các giá này là GIÁ OPTION CỘNG THÊM.
    // ============================================================

    const optionIds = options.map((option) => option.id);

    const variantPrices =
      variantIds.length > 0 && optionIds.length > 0
        ? await db.tbl_menu_option_item_variant_prices.findMany({
            where: {
              variant_id: {
                in: variantIds,
              },
              option_item_id: {
                in: optionIds,
              },
            },
          })
        : [];

    // ============================================================
    // 7. BUILD VARIANT RESPONSE
    // ============================================================

    const variantResponse = variants.map((variant) => ({
      id: variant.id,
      code: variant.code,
      sku: variant.sku ?? null,

      name_vi: variant.name_vi ?? "",
      name_ja: variant.name_ja ?? "",
      name_en: variant.name_en ?? "",
      name_zh: variant.name_zh ?? "",

      // IMPORTANT:
      // Đây là GIÁ THỰC TẾ của size.
      //
      // Regular = 790
      // Mini    = 500
      //
      // Không cộng với product.price nữa.
      price: Number(variant.price ?? 0),

      is_default: variant.is_default,
      is_available: variant.is_available,
      stock_status: variant.stock_status,
      sort_order: variant.sort_order,
    }));

    // ============================================================
    // 8. BUILD OPTION GROUPS
    // ============================================================

    const optionGroups = groups.map((group) => {
      const groupInfo = group.tbl_menu_option_groups;

      const groupOptions = options
        .filter(
          (option) =>
            option.option_group_id === group.option_group_id
        )
        .map((option) => {
          const variantPriceMap: Record<string, number> = {};

          for (const row of variantPrices) {
            if (row.option_item_id !== option.id) {
              continue;
            }

            variantPriceMap[String(row.variant_id)] = Number(
              row.price ?? 0
            );
          }

          const hasVariantPricing =
            Object.keys(variantPriceMap).length > 0;

          return {
            id: option.id,
            code: option.code,

            name_vi: option.name_vi ?? "",
            name_ja: option.name_ja ?? "",
            name_en: option.name_en ?? "",
            name_zh: option.name_zh ?? "",

            name:
              option.name_vi ??
              option.name_ja ??
              option.name_en ??
              option.name_zh ??
              "",

            icon_url: option.icon_url ?? null,

            // Giá mặc định của option.
            //
            // Đây là GIÁ CỘNG THÊM.
            //
            // Ví dụ:
            // Egg = +100
            // Cheese = +250
            price: Number(option.price ?? 0),

            // Giá option theo variant.
            //
            // Key = variantId
            //
            // Ví dụ:
            // {
            //   "1": 100,
            //   "2": 100
            // }
            variantPrices: variantPriceMap,

            pricingMode: hasVariantPricing
              ? "VARIANT"
              : "DEFAULT",

            sort_order: option.sort_order ?? 0,
          };
        });

      // ==========================================================
      // GROUP NAME
      // ==========================================================

      const displayName =
        locale === "ja"
          ? group.display_name_ja ??
            groupInfo.name_ja ??
            group.display_name_vi ??
            groupInfo.name_vi ??
            ""
          : locale === "en"
          ? group.display_name_en ??
            groupInfo.name_en ??
            group.display_name_vi ??
            groupInfo.name_vi ??
            ""
          : locale === "zh"
          ? group.display_name_zh ??
            groupInfo.name_zh ??
            group.display_name_vi ??
            groupInfo.name_vi ??
            ""
          : group.display_name_vi ??
            groupInfo.name_vi ??
            group.display_name_ja ??
            groupInfo.name_ja ??
            "";

      // ==========================================================
      // GROUP SETTINGS
      // ==========================================================

      const isRequired = groupInfo.is_required ?? false;

      const selectionType =
        String(groupInfo.type).toLowerCase() === "multiple"
          ? "multiple"
          : "single";

      const maxChoices = groupInfo.max_choices ?? 1;

      return {
        id: group.id,

        option_group_id: group.option_group_id,

        name_vi:
          group.display_name_vi ??
          groupInfo.name_vi ??
          "",

        name_ja:
          group.display_name_ja ??
          groupInfo.name_ja ??
          "",

        name_en:
          group.display_name_en ??
          groupInfo.name_en ??
          "",

        name_zh:
          group.display_name_zh ??
          groupInfo.name_zh ??
          "",

        name: displayName,

        title: displayName,

        required: isRequired,

        type: selectionType,

        is_required: isRequired,

        selection_type: selectionType,

        min_choices: group.min_choices ?? 0,

        max_choices: maxChoices,

        options: groupOptions,

        sort_order:
          group.sort_order ??
          groupInfo.sort_order ??
          0,
      };
    });

    // ============================================================
    // 9. ALLERGENS
    // ============================================================

    const allergens = await db.tbl_menu_item_allergen.findMany({
      where: {
        menu_item_id: menuItemId,
      },
      include: {
        tbl_allergen: true,
      },
      orderBy: {
        tbl_allergen: {
          sort_order: "asc",
        },
      },
    });

    // ============================================================
    // 10. TAGS
    // ============================================================

    const tags = await db.tbl_menu_item_tag.findMany({
      where: {
        menu_item_id: menuItemId,
      },
      include: {
        tbl_tag: true,
      },
      orderBy: {
        tbl_tag: {
          sort_order: "asc",
        },
      },
    });

    // ============================================================
    // 11. DESCRIPTION
    // ============================================================

    const description =
      locale === "ja"
        ? food.description_ja ??
          food.description_vi ??
          ""
        : locale === "en"
        ? food.description_en ??
          food.description_vi ??
          ""
        : locale === "zh"
        ? food.description_zh ??
          food.description_vi ??
          ""
        : food.description_vi ??
          food.description_ja ??
          "";

    // ============================================================
    // 12. RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      data: {
        ...food,

        description,

        variants: variantResponse,

        optionGroups,

        allergens: allergens.map((a) => ({
          id: a.allergen_id,
          code: a.tbl_allergen.code,

          name_ja: a.tbl_allergen.name_ja,
          name_vi: a.tbl_allergen.name_vi,
          name_en: a.tbl_allergen.name_en,
          name_zh: a.tbl_allergen.name_zh,
        })),

        tags: tags.map((t) => ({
          id: t.tag_id,
          code: t.tbl_tag.code,

          name_ja: t.tbl_tag.name_ja,
          name_vi: t.tbl_tag.name_vi,
          name_en: t.tbl_tag.name_en,
          name_zh: t.tbl_tag.name_zh,

          color: t.tbl_tag.color,
          icon: t.tbl_tag.icon,
        })),
      },
    });
  } catch (error) {
    console.error(
      "[GET /api/menu-items/[id]] API Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message: "Internal Server Error",

        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}
