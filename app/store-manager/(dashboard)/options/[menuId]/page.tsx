import { notFound } from "next/navigation";

import { db } from "@/lib/prisma";

import OptionsClient from "./components/OptionsClient";

import type {
  OptionGroup,
  OptionItem,
} from "./types/option.types";

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  params: Promise<{
    menuId: string;
  }>;
};

/* ============================================================
   PAGE
   ============================================================ */

export default async function OptionsPage({
  params,
}: Props) {
  /* ==========================================================
     PARAMS
     ========================================================== */

  const { menuId: menuIdParam } =
    await params;

  const menuId =
    Number(menuIdParam);

  if (
    !Number.isInteger(menuId) ||
    menuId <= 0
  ) {
    notFound();
  }

  /* ==========================================================
     MENU
     ========================================================== */

  const menu =
    await db.tbl_menu.findUnique({
      where: {
        id: menuId,
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (!menu) {
    notFound();
  }

  /* ==========================================================
     GET OPTION GROUPS
     ========================================================== */

  const groups =
    await db.tbl_menu_option_groups.findMany({
      where: {
        menu_id: menuId,
      },

      include: {
        tbl_menu_option_items: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },

      orderBy: {
        sort_order: "asc",
      },
    });

  /* ==========================================================
     BUILD OPTION GROUPS
     ========================================================== */

  const initialGroups: OptionGroup[] =
    await Promise.all(
      groups.map(
        async (group): Promise<OptionGroup> => {
          /* ==================================================
             USAGE COUNT
             ================================================== */

          const usage_count =
            await db.tbl_menu_item_option_groups.count(
              {
                where: {
                  option_group_id:
                    group.id,
                },
              },
            );

          /* ==================================================
             BUILD ITEMS
             ================================================== */

          const items: OptionItem[] =
            group.tbl_menu_option_items.map(
              (
                item,
              ): OptionItem => ({
                id: item.id,

                option_group_id:
                  item.option_group_id,

                code: item.code,

                name_ja:
                  item.name_ja,

                name_vi:
                  item.name_vi,

                name_en:
                  item.name_en,

                name_zh:
                  item.name_zh,

                icon_url:
                  item.icon_url,

                /*
                 * OptionItem.price là number
                 *
                 * Prisma Decimal -> Number
                 */
                price: Number(
                  item.price,
                ),

                is_available:
                  item.is_available,

                sort_order:
                  item.sort_order,

                created_at:
                  item.created_at,

                updated_at:
                  item.updated_at,

                /*
                 * usage_count là optional
                 * nên có thể bỏ qua nếu
                 * chưa cần tính ở đây.
                 */
              }),
            );

          /* ==================================================
             BUILD GROUP
             ================================================== */

          return {
            id: group.id,

            /*
             * OptionGroup yêu cầu menu_id: number
             *
             * DB của bạn có thể là nullable.
             * Vì query đang lấy theo menuId nên
             * trường hợp này chắc chắn phải là menuId.
             */
            menu_id: group.menu_id ?? menuId,

            code: group.code,

            name_ja:
              group.name_ja,

            name_vi:
              group.name_vi,

            name_en:
              group.name_en,

            name_zh:
              group.name_zh,

            description:
              group.description,

            is_available:
              group.is_available,

            /*
             * Selection settings
             */

            is_required:
              group.is_required ??
              false,

            type:
              group.type ===
              "multiple"
                ? "multiple"
                : "single",

            max_choices:
              group.max_choices ??
              1,

            sort_order:
              group.sort_order,

            /*
             * REQUIRED BY OptionGroup
             */

            created_at:
              group.created_at,

            updated_at:
              group.updated_at,

            /*
             * Optional
             */

            usage_count,

            /*
             * Always array
             */

            items,
          };
        },
      ),
    );

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <OptionsClient
      menuId={menu.id}
      menuName={menu.name}
      initialGroups={
        initialGroups
      }
    />
  );
}