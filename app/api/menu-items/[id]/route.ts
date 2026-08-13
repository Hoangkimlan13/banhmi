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
    const variantId = searchParams.get("variantId") ? Number(searchParams.get("variantId")) : null;

    if (Number.isNaN(menuItemId)) {
      return NextResponse.json(
        { success: false, message: "Invalid menu id" },
        { status: 400 }
      );
    }

    // 1. Lấy thông tin Menu Item
    const food = await db.tbl_menu_item.findFirst({
      where: {
        id: menuItemId,
        is_available: true,
      },
    });

    if (!food) {
      return NextResponse.json(
        { success: false, message: "Menu item not found" },
        { status: 404 }
      );
    }

    // 2. Lấy danh sách Option Groups của món liên kết với tbl_option_group_templates
    const groups = await db.tbl_menu_item_option_groups.findMany({
      where: {
        menu_item_id: menuItemId,
        is_available: true,
      },
      include: {
        tbl_option_group_templates: true,
      },
      orderBy: {
        sort_order: "asc",
      },
    });

    if (groups.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          ...food,
          optionGroups: [],
        },
      });
    }

    // 3. Lấy Option Items kèm template đa ngôn ngữ
    const options = await db.tbl_menu_item_option_items.findMany({
      where: {
        menu_option_group_id: {
          in: groups.map((g) => g.id),
        },
        is_available: true,
      },
      orderBy: {
        sort_order: "asc",
      },
      include: {
        tbl_option_item_templates: true,
        tbl_variant_option_prices: variantId ? {
          where: {
            variant_id: variantId,
            is_available: true
          }
        } : false,
      },
    });

    const optionGroups = groups.map((group) => {
      const template = group.tbl_option_group_templates;

      const isRequired = template
        ? template.is_required === true || (typeof template.is_required === 'number' && template.is_required === 1)
        : false;

      return {
        id: group.id,
        // Đưa các trường ngôn ngữ của group template ra đây
        name_vi: template?.name_vi ?? "",
        name_ja: template?.name_ja ?? "",
        name_en: template?.name_en ?? "",
        name_zh: template?.name_zh ?? "",
        
        // fallback title
        title: template?.name_vi ?? template?.name_ja ?? "",

        required: isRequired,

        type: template?.type ?? "single",

        options: options
          .filter((o) => o.menu_option_group_id === group.id)
          .map((o) => {
            const optTemplate = o.tbl_option_item_templates;

            let price = Number(o.additional_price || 0);

            if (
              variantId &&
              o.tbl_variant_option_prices &&
              o.tbl_variant_option_prices.length > 0
            ) {
              price = Number(
                o.tbl_variant_option_prices[0].additional_price
              );
            }

            return {
              id: o.id,
              name_vi: optTemplate?.name_vi ?? "",
              name_ja: optTemplate?.name_ja ?? "",
              name_en: optTemplate?.name_en ?? "",
              name_zh: optTemplate?.name_zh ?? "",
              name: optTemplate?.name_vi ?? optTemplate?.name_ja ?? "",
              price,
            };
          }),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        ...food,
        optionGroups,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}