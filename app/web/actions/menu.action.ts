'use server';

import { db } from "@/lib/prisma";

// Hàm hỗ trợ serialize an toàn cho các kiểu dữ liệu của Prisma (Decimal, Date, ...)
function safeJson<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "object" && value !== null && "toNumber" in value
        ? value.toNumber()
        : value
    )
  );
}

/**
 * 1. Lấy danh sách cửa hàng đúng điều kiện
 */
export async function getActiveStores() {
  try {
    const stores = await db.tbl_store.findMany({
      where: {
        type: { in: ["Shop", "Truck"] },
        tbl_menu: {
          some: {
            is_active: true,
            tbl_menu_item: {
              some: { is_available: true }
            }
          }
        }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        color: true,
        address: true,
        google_map_url: true,
        phone: true,
        open_time: true,
        close_time: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { sort_order: "asc" }
    });

    const result = await Promise.all(
      stores.map(async (store) => {
        try {
          if (store.type === "Shop") {
            return {
              id: store.id,
              title: store.title,
              slug: store.slug,
              type: store.type,
              color: store.color,
              address: store.address,
              googleMapUrl: store.google_map_url,
              openTime: store.open_time,
              closeTime: store.close_time,
              latitude: store.latitude,
              longitude: store.longitude,
            };
          }

          if (store.type === "Truck") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const schedule = await db.tbl_store_daily_schedule.findFirst({
              where: {
                store_id: store.id,
                work_date: today,
                status: { in: ["SCHEDULED", "OPEN"] }
              },
              select: {
                location_name: true,
                address: true,
                google_map_url: true,
                open_time: true,
                close_time: true,
                latitude: true,
                longitude: true,
              }
            });

            return {
              id: store.id,
              title: store.title,
              slug: store.slug,
              type: store.type,
              color: store.color,
              address: schedule?.address ?? store.address,
              locationName: schedule?.location_name ?? null,
              googleMapUrl: schedule?.google_map_url ?? store.google_map_url,
              openTime: schedule?.open_time ?? store.open_time,
              closeTime: schedule?.close_time ?? store.close_time,
              latitude: schedule?.latitude ?? store.latitude,
              longitude: schedule?.longitude ?? store.longitude,
            };
          }

          return null;
        } catch (storeError) {
          console.error("PROCESS STORE ERROR:", store.id, storeError);
          return null;
        }
      })
    );

    const cleanResult = result.filter((store) => store !== null);
    return safeJson(cleanResult);

  } catch (error) {
    console.error("getActiveStores MAIN ERROR:", error);
    return [];
  }
}

/**
 * 2. Lấy thông tin chi tiết một cửa hàng theo storeId
 */
export async function getStoreInfo(storeId: number) {
  try {
    const store = await db.tbl_store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        address: true,
        google_map_url: true,
        phone: true,
        open_time: true,
        close_time: true,
        latitude: true,
        longitude: true,
        pickup_note: true,
      }
    });

    if (!store) return null;

    let data = null;

    if (store.type === "Shop") {
      data = {
        id: store.id,
        name: store.title,
        title: store.title,
        slug: store.slug,
        type: store.type,
        address: store.address,
        googleMapUrl: store.google_map_url,
        phone: store.phone,
        openTime: store.open_time,
        closeTime: store.close_time,
        latitude: store.latitude,
        longitude: store.longitude,
        pickupNote: store.pickup_note,
      };
    } else if (store.type === "Truck") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedule = await db.tbl_store_daily_schedule.findFirst({
        where: {
          store_id: store.id,
          work_date: today,
          status: { in: ["SCHEDULED", "OPEN"] }
        },
        select: {
          location_name: true,
          address: true,
          google_map_url: true,
          open_time: true,
          close_time: true,
          latitude: true,
          longitude: true,
          pickup_note: true,
        }
      });

      data = {
        id: store.id,
        name: store.title,
        title: store.title,
        slug: store.slug,
        type: store.type,
        address: schedule?.address ?? store.address,
        locationName: schedule?.location_name ?? null,
        googleMapUrl: schedule?.google_map_url ?? store.google_map_url,
        phone: store.phone,
        openTime: schedule?.open_time ?? store.open_time,
        closeTime: schedule?.close_time ?? store.close_time,
        latitude: schedule?.latitude ?? store.latitude,
        longitude: schedule?.longitude ?? store.longitude,
        pickupNote: schedule?.pickup_note ?? store.pickup_note,
      };
    }

    return safeJson(data);

  } catch (error) {
    console.error("getStoreInfo error:", error);
    return null;
  }
}

/**
 * 2.1. Lấy thông tin chi tiết một cửa hàng theo slug
 */
export async function getStoreInfoBySlug(slug: string) {
  try {
    const store = await db.tbl_store.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        address: true,
        google_map_url: true,
        phone: true,
        open_time: true,
        close_time: true,
        latitude: true,
        longitude: true,
        pickup_note: true,
      }
    });

    if (!store) return null;

    let data = null;

    if (store.type === "Shop") {
      data = {
        id: store.id,
        name: store.title,
        title: store.title,
        slug: store.slug,
        type: store.type,
        address: store.address,
        googleMapUrl: store.google_map_url,
        phone: store.phone,
        openTime: store.open_time,
        closeTime: store.close_time,
        latitude: store.latitude,
        longitude: store.longitude,
        pickupNote: store.pickup_note,
      };
    } else if (store.type === "Truck") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const schedule = await db.tbl_store_daily_schedule.findFirst({
        where: {
          store_id: store.id,
          work_date: today,
          status: { in: ["SCHEDULED", "OPEN"] }
        },
        select: {
          location_name: true,
          address: true,
          google_map_url: true,
          open_time: true,
          close_time: true,
          latitude: true,
          longitude: true,
          pickup_note: true,
        }
      });

      data = {
        id: store.id,
        name: store.title,
        title: store.title,
        slug: store.slug,
        type: store.type,
        address: schedule?.address ?? store.address,
        locationName: schedule?.location_name ?? null,
        googleMapUrl: schedule?.google_map_url ?? store.google_map_url,
        phone: store.phone,
        openTime: schedule?.open_time ?? store.open_time,
        closeTime: schedule?.close_time ?? store.close_time,
        latitude: schedule?.latitude ?? store.latitude,
        longitude: schedule?.longitude ?? store.longitude,
        pickupNote: schedule?.pickup_note ?? store.pickup_note,
      };
    }

    return safeJson(data);

  } catch (error) {
    console.error("getStoreInfoBySlug error:", error);
    return null;
  }
}

/**
 * 3. Lấy danh mục món ăn (Categories) theo storeId
 */
export async function getMenuCategories(storeId?: number) {
  try {
    const categories = await db.tbl_menu_category.findMany({
      orderBy: { display_order: 'asc' },
    });
    return safeJson(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

/**
 * 4. Lấy danh sách món ăn theo storeId
 */
export async function getMenuItems(storeId?: number) {
  try {
    const items = await db.tbl_menu_item.findMany({
      where: {
        store_id: storeId,
        is_available: true,
      },
      include: {
        tbl_menu_item_variants: true,
      },
      orderBy: { display_order: 'asc' },
    });

    return safeJson(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }
}