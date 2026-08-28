import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ============================================================
   JST TODAY
   ============================================================ */

function getTodayJstDate() {
  const now = new Date();

  const jst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // en-CA => YYYY-MM-DD
  return new Date(`${jst}T00:00:00.000Z`);
}

/* ============================================================
   PAGE
   ============================================================ */

export default async function MenuPage() {
  const session = await getStoreSession();

  if (!session?.storeId) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
        }}
      >
        店舗ログイン情報がありません。
      </div>
    );
  }

  const storeId = Number(session.storeId);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
        }}
      >
        店舗情報が不正です。
      </div>
    );
  }

  try {
    /* ========================================================
       1. STORE
       ======================================================== */

    const store = await db.tbl_store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        id: true,
        type: true,
        title: true,
      },
    });

    if (!store) {
      return (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
          }}
        >
          店舗が見つかりません。
        </div>
      );
    }

    /* ========================================================
       2. DETERMINE MENU
       
       SHOP
       → default menu

       TRUCK
       → today's schedule.menu_id ONLY
       ======================================================== */

    let menuId: number | null = null;

    let todaySchedule = null;

    /* ========================================================
       TRUCK
       ======================================================== */

    if (store.type === "Truck") {
      const today = getTodayJstDate();

      todaySchedule =
        await db.tbl_store_schedule.findUnique({
          where: {
            store_id_work_date: {
              store_id: storeId,
              work_date: today,
            },
          },
          select: {
            id: true,
            store_id: true,
            menu_id: true,
            work_date: true,
            schedule_type: true,
            location_id: true,
            location_name: true,
            address: true,
            open_time: true,
            close_time: true,
            last_order_time: true,
            accepting_orders: true,
            status: true,
          },
        });

      /* ------------------------------------------------------
         Truck MUST have today's schedule
         ------------------------------------------------------ */

      if (!todaySchedule) {
        return (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                marginBottom: "8px",
              }}
            >
              本日の営業予定がありません
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              本日の出店スケジュールが登録されていないため、
              販売状況を管理できません。
            </p>
          </div>
        );
      }

      /* ------------------------------------------------------
         Schedule exists but no menu
         ------------------------------------------------------ */

      if (!todaySchedule.menu_id) {
        return (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                marginBottom: "8px",
              }}
            >
              本日のメニューが設定されていません
            </h2>

            <p
              style={{
                color: "#666",
                margin: 0,
              }}
            >
              本日の出店スケジュールにメニューが設定されていません。
            </p>
          </div>
        );
      }

      menuId = Number(todaySchedule.menu_id);

      console.log(
        "[MenuPage] Truck today's menu:",
        {
          storeId,
          scheduleId: todaySchedule.id,
          workDate: todaySchedule.work_date,
          menuId,
          locationName:
            todaySchedule.location_name,
          address:
            todaySchedule.address,
        }
      );
    }

    /* ========================================================
       SHOP
       ======================================================== */

    if (store.type === "Shop") {
      const defaultMenu =
        await db.tbl_menu.findFirst({
          where: {
            store_id: storeId,
            is_default: true,
            is_active: true,
          },
          select: {
            id: true,
          },
        });

      if (defaultMenu) {
        menuId = Number(defaultMenu.id);
      }
    }

    /* ========================================================
       SAFETY CHECK
       ======================================================== */

    if (!menuId) {
      return (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
          }}
        >
          メニューが登録されていません。
        </div>
      );
    }

    /* ========================================================
       3. VERIFY MENU BELONGS TO STORE
       ======================================================== */

    const menu = await db.tbl_menu.findFirst({
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
      console.error(
        "[MenuPage] Menu does not belong to store:",
        {
          storeId,
          menuId,
        }
      );

      return (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
          }}
        >
          メニュー情報が不正です。
        </div>
      );
    }

    /* ========================================================
       4. CATEGORIES
       ======================================================== */

    const categories =
      await db.tbl_menu_category.findMany({
        where: {
          menu_id: menuId,
          is_active: true,
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
       5. ITEMS
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

    const itemIds = items.map(
      (item) => Number(item.id)
    );

    /* ========================================================
       6. ITEM OPTION GROUPS
       ======================================================== */

    const itemOptionGroups =
      itemIds.length > 0
        ? await db.tbl_menu_item_option_groups.findMany(
            {
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
            }
          )
        : [];

    const optionGroupIds = [
      ...new Set(
        itemOptionGroups.map(
          (row) =>
            Number(row.option_group_id)
        )
      ),
    ];

    /* ========================================================
       7. OPTION GROUPS
       ======================================================== */

    const optionGroups =
      optionGroupIds.length > 0
        ? await db.tbl_menu_option_groups.findMany(
            {
              where: {
                id: {
                  in: optionGroupIds,
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
            }
          )
        : [];

    /* ========================================================
       8. OPTION ITEMS
       ======================================================== */

    const optionItems =
      optionGroupIds.length > 0
        ? await db.tbl_menu_option_items.findMany(
            {
              where: {
                option_group_id: {
                  in: optionGroupIds,
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
            }
          )
        : [];

    /* ========================================================
       DEBUG
       ======================================================== */

    console.log(
      "================================================"
    );

    console.log(
      "[MenuPage] MENU MANAGER"
    );

    console.log({
      storeId,
      storeType: store.type,

      menuId,
      menuName: menu.name,

      todayScheduleId:
        todaySchedule?.id ?? null,

      todayLocation:
        todaySchedule?.location_name ??
        null,

      categoryCount:
        categories.length,

      itemCount:
        items.length,

      itemOptionGroupCount:
        itemOptionGroups.length,

      optionGroupCount:
        optionGroups.length,

      optionItemCount:
        optionItems.length,
    });

    console.log(
      "================================================"
    );

    /* ========================================================
       9. SERIALIZE
       ======================================================== */

    const serializedCategories =
      categories.map((category) => ({
        id: Number(category.id),

        menu_id:
          Number(category.menu_id),

        name_ja:
          category.name_ja,

        name_vi:
          category.name_vi ?? null,

        name_en:
          category.name_en ?? null,

        name_zh:
          category.name_zh ?? null,

        description_ja:
          category.description_ja ??
          null,

        description_vi:
          category.description_vi ??
          null,

        image_url:
          category.image_url ??
          null,

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
       OPTION GROUP
       ======================================================== */

    const serializedOptionGroups =
      optionGroups.map((group) => ({
        id: Number(group.id),

        code: group.code,

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
      }));

    /* ========================================================
       OPTION ITEMS
       ======================================================== */

    const serializedOptionItems =
      optionItems.map((option) => ({
        id: Number(option.id),

        option_group_id:
          Number(
            option.option_group_id
          ),

        code: option.code,

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
      }));

    /* ========================================================
       ITEM OPTION GROUPS
       ======================================================== */

    const serializedItemOptionGroups =
      itemOptionGroups.map(
        (row) => ({
          id: Number(row.id),

          menu_item_id:
            Number(
              row.menu_item_id
            ),

          option_group_id:
            Number(
              row.option_group_id
            ),

          display_name_ja:
            row.display_name_ja ??
            null,

          display_name_vi:
            row.display_name_vi ??
            null,

          display_name_en:
            row.display_name_en ??
            null,

          display_name_zh:
            row.display_name_zh ??
            null,

          is_available:
            Boolean(
              row.is_available
            ),

          sort_order:
            Number(
              row.sort_order ?? 0
            ),
        })
      );

    /* ========================================================
       ITEMS
       ======================================================== */

    const serializedItems =
      items.map((item) => ({
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
          Number(
            item.price ?? 0
          ),

        display_order:
          Number(
            item.display_order ?? 0
          ),

        is_available:
          item.status === "ACTIVE",

        status:
          item.status,
      }));

    /* ========================================================
       10. CLIENT
       ======================================================== */

    return (
      <MenuClient
        initialCategories={
          serializedCategories
        }

        initialItems={
          serializedItems
        }

        initialOptionGroups={
          serializedOptionGroups
        }

        initialOptionItems={
          serializedOptionItems
        }

        initialItemOptionGroups={
          serializedItemOptionGroups
        }

        storeType={store.type}

        menuId={menu.id}

        menuName={menu.name}

        scheduleInfo={
          todaySchedule
            ? {
                id: Number(
                  todaySchedule.id
                ),

                workDate:
                  todaySchedule.work_date
                    .toISOString()
                    .slice(0, 10),

                locationName:
                  todaySchedule.location_name,

                address:
                  todaySchedule.address,
              }
            : null
        }
      />
    );
  } catch (error) {
    console.error(
      "[MenuPage] Database error:",
      error
    );

    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
        }}
      >
        メニュー情報の取得に失敗しました。
      </div>
    );
  }
}