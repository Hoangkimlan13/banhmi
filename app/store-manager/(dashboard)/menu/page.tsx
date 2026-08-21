import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MenuPage() {
  const session = await getStoreSession();

  if (!session?.storeId) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        店舗ログイン情報がありません。
      </div>
    );
  }

  const storeId = Number(session.storeId);

  if (!Number.isInteger(storeId) || storeId <= 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        店舗情報が不正です。
      </div>
    );
  }

  try {
    // ============================================================
    // CATEGORIES - KIỂM TRA DỮ LIỆU THỰC TẾ TỪ DB
    // ============================================================
    const categories = await db.tbl_menu_category.findMany({
      where: { 
        store_id: storeId,
      },
      orderBy: [ 
        { display_order: "asc" }, 
        { id: "asc" }, 
      ], 
    });

    // IN RA TERMINAL ĐỂ KIỂM TRA
    console.log("=== DEBUG CATEGORIES ===", {
      storeId,
      count: categories.length,
      data: categories,
    });

    // ============================================================
    // MENU ITEMS
    // ============================================================
    const items = await db.tbl_menu_item.findMany({
      where: {
        store_id: storeId,
      },
      orderBy: [
        { display_order: "asc" },
        { id: "asc" },
      ],
    });

    console.log("=== DEBUG ITEMS ===", {
      count: items.length,
    });

    // ============================================================
    // SERIALIZE
    // ============================================================
    const serializedCategories = categories.map((category) => ({
      id: Number(category.id),
      menu_id: Number(category.menu_id),
      store_id: Number(category.store_id),

      name_ja: category.name_ja,
      name_vi: category.name_vi ?? null,
      name_en: category.name_en ?? null,
      name_zh: category.name_zh ?? null,

      description_ja: category.description_ja ?? null,
      description_vi: category.description_vi ?? null,

      image_url: category.image_url ?? null,

      display_order: Number(category.display_order ?? 0),

      is_active: Boolean(category.is_active),
    }));

    const serializedItems = items.map((item) => ({
      id: Number(item.id),
      menu_id: Number(item.menu_id),
      store_id: Number(item.store_id),
      category_id: Number(item.category_id),

      name_ja: item.name_ja,
      name_vi: item.name_vi ?? null,
      name_en: item.name_en ?? null,
      name_zh: item.name_zh ?? null,

      description_ja: item.description_ja ?? null,
      description_vi: item.description_vi ?? null,
      description_en: item.description_en ?? null,
      description_zh: item.description_zh ?? null,

      image_url: item.image_url ?? null,

      price: Number(item.price ?? 0),

      display_order: Number(item.display_order ?? 0),

      is_available: Boolean(item.is_available),
    }));

    return (
      <MenuClient
        initialCategories={serializedCategories}
        initialItems={serializedItems}
      />
    );
  } catch (error) {
    console.error("[MenuPage] Database error:", error);

    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        メニュー情報の取得に失敗しました。
      </div>
    );
  }
}