import { notFound, redirect } from "next/navigation";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

import MenuEditorClient from "./MenuEditorClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ============================================================
   PAGE PROPS
   ============================================================ */

type PageProps = {
  params: Promise<{
    menuId: string;
  }>;
};

/* ============================================================
   MENU ITEM STATUS
   ============================================================ */

type MenuItemStatus =
  | "ACTIVE"
  | "PAUSED"
  | "DISCONTINUED";

/* ============================================================
   NORMALIZE MENU ITEM STATUS
   ============================================================ */

function normalizeMenuItemStatus(
  status: unknown
): MenuItemStatus {
  if (status === "PAUSED") {
    return "PAUSED";
  }

  if (status === "DISCONTINUED") {
    return "DISCONTINUED";
  }

  return "ACTIVE";
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function MenuEditorPage({
  params,
}: PageProps) {
  /* ==========================================================
     STORE SESSION
     ========================================================== */

  const session = await getStoreSession();

  if (!session?.storeId) {
    redirect("/store-manager/login");
  }

  const storeId = Number(session.storeId);

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    redirect("/store-manager/login");
  }

  /* ==========================================================
     MENU ID
     ========================================================== */

  const {
    menuId: menuIdParam,
  } = await params;

  const menuId = Number(menuIdParam);

  if (
    !Number.isInteger(menuId) ||
    menuId <= 0
  ) {
    notFound();
  }

  try {
    /* ========================================================
       STORE
       ======================================================== */

    const store =
      await db.tbl_store.findUnique({
        where: {
          id: storeId,
        },

        select: {
          id: true,
          title: true,
          type: true,
        },
      });

    if (!store) {
      notFound();
    }

    /* ========================================================
       MENU

       IMPORTANT:
       Menu MUST belong to current store.
       ======================================================== */

    const menu =
      await db.tbl_menu.findFirst({
        where: {
          id: menuId,
          store_id: storeId,
        },

        select: {
          id: true,
          store_id: true,
          name: true,
          is_default: true,
          is_active: true,
        },
      });

    if (!menu) {
      notFound();
    }

    /* ========================================================
       CATEGORIES
       ======================================================== */

    const categories =
      await db.tbl_menu_category.findMany({
        where: {
          menu_id: menuId,
        },

        orderBy: [
          {
            display_order: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    /* ========================================================
       MENU ITEMS
       ======================================================== */

    const items =
      await db.tbl_menu_item.findMany({
        where: {
          menu_id: menuId,
        },

        orderBy: [
          {
            display_order: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    /* ========================================================
       ITEM IDS
       ======================================================== */

    const itemIds = items.map(
      (item) => Number(item.id)
    );

    /* ========================================================
       ITEM ↔ OPTION GROUP

       tbl_menu_item_option_groups

       IMPORTANT:
       This table DOES NOT have group_template_id.

       Actual fields:

       id
       menu_item_id
       option_group_id
       display_name_ja
       display_name_vi
       display_name_en
       display_name_zh
       selection_type
       is_required
       min_choices
       max_choices
       is_available
       sort_order
       ======================================================== */

    const itemOptionGroups =
      itemIds.length > 0
        ? await db.tbl_menu_item_option_groups.findMany({
            where: {
              menu_item_id: {
                in: itemIds,
              },
            },

            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          })
        : [];

    /* ========================================================
       ITEM ↔ OPTION ITEM

       tbl_menu_item_option_items
       ======================================================== */

    const itemOptionItems =
      itemIds.length > 0
        ? await db.tbl_menu_item_option_items.findMany({
            where: {
              menu_item_id: {
                in: itemIds,
              },
            },

            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          })
        : [];

    /* ========================================================
       MENU OPTION GROUPS

       Load ALL option groups belonging to this menu.

       Actual schema:

       id
       menu_id
       code
       name_ja
       name_vi
       name_en
       name_zh
       description
       is_available
       is_required
       type
       max_choices
       sort_order
       created_at
       updated_at

       IMPORTANT:
       NO group_template_id.
       ======================================================== */

    const menuOptionGroups =
      await db.tbl_menu_option_groups.findMany({
        where: {
          menu_id: menuId,
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

    /* ========================================================
       MENU OPTION GROUP IDS
       ======================================================== */

    const menuOptionGroupIds =
      menuOptionGroups.map(
        (group) => Number(group.id)
      );

    /* ========================================================
       OPTION GROUPS

       tbl_menu_option_groups itself is the option group
       source for this menu.

       No group_template_id.
       ======================================================== */

    const optionGroups =
      menuOptionGroupIds.length > 0
        ? await db.tbl_menu_option_groups.findMany({
            where: {
              id: {
                in: menuOptionGroupIds,
              },
            },

            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          })
        : [];

    /* ========================================================
       OPTION ITEMS
       ======================================================== */

    const optionItems =
      menuOptionGroupIds.length > 0
        ? await db.tbl_menu_option_items.findMany({
            where: {
              option_group_id: {
                in: menuOptionGroupIds,
              },
            },

            orderBy: [
              {
                sort_order: "asc",
              },
              {
                id: "asc",
              },
            ],
          })
        : [];

    /* ========================================================
       SERIALIZE STORE
       ======================================================== */

    const serializedStore = {
      id: Number(store.id),

      title: store.title,

      type: store.type,
    };

    /* ========================================================
       SERIALIZE MENU
       ======================================================== */

    const serializedMenu = {
      id: Number(menu.id),

      store_id: Number(menu.store_id),

      name: menu.name,

      is_default: Boolean(
        menu.is_default
      ),

      is_active: Boolean(
        menu.is_active
      ),
    };

    /* ========================================================
       SERIALIZE CATEGORIES
       ======================================================== */

    const serializedCategories =
      categories.map((category) => ({
        id: Number(category.id),

        menu_id: Number(
          category.menu_id
        ),

        name_ja:
          category.name_ja,

        name_vi:
          category.name_vi ?? null,

        name_en:
          category.name_en ?? null,

        name_zh:
          category.name_zh ?? null,

        description_ja:
          category.description_ja ?? null,

        description_vi:
          category.description_vi ?? null,

        image_url:
          category.image_url ?? null,

        display_order:
          Number(
            category.display_order ?? 0
          ),

        is_active:
          Boolean(
            category.is_active
          ),
      }));

    /* ========================================================
       SERIALIZE MENU ITEMS

       status:
         ACTIVE
         PAUSED
         DISCONTINUED

       is_available:
         derived from status.
       ======================================================== */

    const serializedItems =
      items.map((item) => {
        const status =
          normalizeMenuItemStatus(
            item.status
          );

        return {
          id: Number(item.id),

          menu_id:
            Number(item.menu_id),

          category_id:
            Number(item.category_id),

          name_ja:
            item.name_ja,

          name_vi:
            item.name_vi ?? null,

          name_en:
            item.name_en ?? null,

          name_zh:
            item.name_zh ?? null,

          description_ja:
            item.description_ja ?? null,

          description_vi:
            item.description_vi ?? null,

          description_en:
            item.description_en ?? null,

          description_zh:
            item.description_zh ?? null,

          image_url:
            item.image_url ?? null,

          price:
            Number(item.price ?? 0),

          display_order:
            Number(
              item.display_order ?? 0
            ),

          status,

          is_available:
            status === "ACTIVE",
        };
      });

    /* ========================================================
       SERIALIZE ITEM ↔ OPTION GROUP

       IMPORTANT:

       tbl_menu_item_option_groups DOES NOT HAVE:
         group_template_id

       It HAS:
         option_group_id
         selection_type
         is_required
         min_choices
         max_choices
       ======================================================== */

    const serializedItemOptionGroups =
      itemOptionGroups.map((row) => ({
        id: Number(row.id),

        menu_item_id:
          Number(row.menu_item_id),

        option_group_id:
          Number(row.option_group_id),

        display_name_ja:
          row.display_name_ja ?? null,

        display_name_vi:
          row.display_name_vi ?? null,

        display_name_en:
          row.display_name_en ?? null,

        display_name_zh:
          row.display_name_zh ?? null,

        selection_type:
          row.selection_type,

        is_required:
          Boolean(row.is_required),

        min_choices:
          Number(
            row.min_choices ?? 0
          ),

        max_choices:
          row.max_choices != null
            ? Number(row.max_choices)
            : null,

        is_available:
          Boolean(
            row.is_available
          ),

        sort_order:
          Number(
            row.sort_order ?? 0
          ),
      }));

    /* ========================================================
       SERIALIZE ITEM ↔ OPTION ITEM
       ======================================================== */

    const serializedItemOptionItems =
      itemOptionItems.map((row) => ({
        id: Number(row.id),

        menu_item_id:
          Number(row.menu_item_id),

        option_group_id:
          Number(row.option_group_id),

        option_item_id:
          Number(row.option_item_id),

        is_available:
          Boolean(
            row.is_available
          ),

        sort_order:
          Number(
            row.sort_order ?? 0
          ),
      }));

    /* ========================================================
       SERIALIZE MENU OPTION GROUPS

       IMPORTANT:

       tbl_menu_option_groups DOES NOT HAVE:
         group_template_id

       It HAS:

         is_required
         type
         max_choices
       ======================================================== */

    const serializedMenuOptionGroups =
      menuOptionGroups.map(
        (group) => ({
          id: Number(group.id),

          menu_id:
            group.menu_id != null
              ? Number(group.menu_id)
              : null,

          code:
            group.code,

          name_ja:
            group.name_ja,

          name_vi:
            group.name_vi ?? null,

          name_en:
            group.name_en ?? null,

          name_zh:
            group.name_zh ?? null,

          description:
            group.description ?? null,

          is_available:
            Boolean(
              group.is_available
            ),

          is_required:
            Boolean(
              group.is_required
            ),

          type:
            group.type,

          max_choices:
            Number(
              group.max_choices ?? 1
            ),

          sort_order:
            Number(
              group.sort_order ?? 0
            ),
        })
      );

    /* ========================================================
       SERIALIZE OPTION GROUPS

       Same database table:

       tbl_menu_option_groups

       This type is used by existing client components
       that only need basic group information.
       ======================================================== */

    const serializedOptionGroups =
      optionGroups.map(
        (group) => ({
          id: Number(group.id),

          code:
            group.code,

          name_ja:
            group.name_ja,

          name_vi:
            group.name_vi ?? null,

          name_en:
            group.name_en ?? null,

          name_zh:
            group.name_zh ?? null,

          description:
            group.description ?? null,

          is_available:
            Boolean(
              group.is_available
            ),

          sort_order:
            Number(
              group.sort_order ?? 0
            ),
        })
      );

    /* ========================================================
       SERIALIZE OPTION ITEMS
       ======================================================== */

    const serializedOptionItems =
      optionItems.map(
        (option) => ({
          id: Number(option.id),

          option_group_id:
            Number(
              option.option_group_id
            ),

          code:
            option.code,

          name_ja:
            option.name_ja,

          name_vi:
            option.name_vi ?? null,

          name_en:
            option.name_en ?? null,

          name_zh:
            option.name_zh ?? null,

          icon_url:
            option.icon_url ?? null,

          price:
            Number(
              option.price ?? 0
            ),

          is_available:
            Boolean(
              option.is_available
            ),

          sort_order:
            Number(
              option.sort_order ?? 0
            ),
        })
      );

    /* ========================================================
       RETURN
       ======================================================== */

    return (
      <MenuEditorClient
        store={
          serializedStore
        }

        menu={
          serializedMenu
        }

        initialCategories={
          serializedCategories
        }

        initialItems={
          serializedItems
        }

        initialItemOptionGroups={
          serializedItemOptionGroups
        }

        initialItemOptionItems={
          serializedItemOptionItems
        }

        initialOptionGroups={
          serializedOptionGroups
        }

        initialOptionItems={
          serializedOptionItems
        }

        initialMenuOptionGroups={
          serializedMenuOptionGroups
        }
      />
    );
  } catch (error) {
    console.error(
      "[MenuEditorPage] Database error:",
      error
    );

    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
        }}
      >
        メニュー情報の取得に失敗しました。
      </div>
    );
  }
}