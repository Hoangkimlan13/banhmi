import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";
import MenuSettingsClient from "./MenuSettingsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MenuSettingsPage() {
  // ============================================================
  // STORE SESSION
  // ============================================================

  const session = await getStoreSession();

  if (!session?.storeId) {
    return (
      <div className="pageError">
        店舗ログイン情報がありません。
      </div>
    );
  }

  const storeId = Number(session.storeId);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return (
      <div className="pageError">
        店舗情報が不正です。
      </div>
    );
  }

  // ============================================================
  // STORE
  // ============================================================

  const store = await db.tbl_store.findUnique({
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
    return (
      <div className="pageError">
        店舗が見つかりません。
      </div>
    );
  }

  // ============================================================
  // MENUS
  // ============================================================

  const menus = await db.tbl_menu.findMany({
    where: {
      store_id: storeId,
    },

    orderBy: [
      {
        is_default: "desc",
      },
      {
        id: "asc",
      },
    ],

    select: {
      id: true,
      store_id: true,
      name: true,
      is_default: true,
      is_active: true,

      _count: {
        select: {
          tbl_menu_category: true,
          tbl_menu_item: true,
        },
      },
    },
  });

  const serializedMenus = menus.map((menu) => ({
    id: Number(menu.id),
    store_id: Number(menu.store_id),
    name: menu.name,
    is_default: Boolean(menu.is_default),
    is_active: Boolean(menu.is_active),

    categoryCount:
      menu._count.tbl_menu_category,

    itemCount:
      menu._count.tbl_menu_item,
  }));

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <MenuSettingsClient
      store={{
        id: Number(store.id),
        title: store.title,
        type: String(store.type),
      }}
      initialMenus={serializedMenus}
    />
  );
}