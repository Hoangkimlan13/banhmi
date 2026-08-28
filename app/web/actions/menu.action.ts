"use server";

import { db } from "@/lib/prisma";

// ============================================================
// TYPES
// ============================================================

type StoreResult = {
  id: number;
  title: string;
  slug: string;
  type: string;
  color: string | null;

  address: string | null;
  googleMapUrl: string | null;

  openTime: Date | null;
  closeTime: Date | null;

  latitude: number | null;
  longitude: number | null;

  locationName: string | null;

  // MENU CỦA NGÀY HÔM ĐÓ
  menuId: number | null;

  // ORDER STATUS
  acceptingOrders: boolean;
  orderStatusDate: Date | null;
  orderStopReason: string | null;
  orderStoppedAt: Date | null;
  orderReopenAt: Date | null;
};

// ============================================================
// SAFE JSON
// ============================================================

function safeJson<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "object" &&
      value !== null &&
      "toNumber" in value
        ? value.toNumber()
        : value
    )
  );
}

// ============================================================
// JAPAN TODAY
// ============================================================

function getJapanTodayDate(): Date {
  const now = new Date();

  const japanDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  return new Date(`${japanDate}T00:00:00.000Z`);
}

// ============================================================
// 1. ACTIVE STORES
// ============================================================

export async function getActiveStores(): Promise<StoreResult[]> {
  try {
    const stores = await db.tbl_store.findMany({
      where: {
        type: {
          in: ["Shop", "Truck"],
        },

        // ★ QUAN TRỌNG
        // Chỉ lấy store có slug
        slug: {
          not: null,
        },

        tbl_menu: {
          some: {
            is_active: true,

            tbl_menu_item: {
              some: {
                status: {
                  in: ["ACTIVE", "PAUSED"],
                },
              },
            },
          },
        },
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

        pickup_note: true,

        // ORDER STATUS
        accepting_orders: true,
        order_status_date: true,
        order_stop_reason: true,
        order_stopped_at: true,
        order_reopen_at: true,
      },

      orderBy: {
        sort_order: "asc",
      },
    });

    const today = getJapanTodayDate();

    console.log(
      "[getActiveStores] Japan today:",
      today.toISOString()
    );

    const result = await Promise.all(
      stores.map(
        async (
          store
        ): Promise<StoreResult | null> => {
          try {
            // ==================================================
            // SAFETY CHECK
            // ==================================================

            // Prisma vẫn có thể giữ type string | null
            // dù where đã lọc not null.
            if (!store.slug) {
              console.warn(
                "[getActiveStores] Store has no slug:",
                store.id,
                store.title
              );

              return null;
            }

            // ==================================================
            // SHOP
            // ==================================================

            if (store.type === "Shop") {
              return {
                id: store.id,
                title: store.title,
                slug: store.slug,
                type: store.type,
                color: store.color,

                address: store.address,
                googleMapUrl:
                  store.google_map_url,

                openTime: store.open_time,
                closeTime: store.close_time,

                latitude: store.latitude
                  ? Number(store.latitude)
                  : null,

                longitude: store.longitude
                  ? Number(store.longitude)
                  : null,

                locationName: null,

                // Shop không dùng daily menu
                menuId: null,

                acceptingOrders:
                  store.accepting_orders,

                orderStatusDate:
                  store.order_status_date,

                orderStopReason:
                  store.order_stop_reason,

                orderStoppedAt:
                  store.order_stopped_at,

                orderReopenAt:
                  store.order_reopen_at,
              };
            }

            // ==================================================
            // TRUCK
            // ==================================================

            if (store.type === "Truck") {
              const schedule =
                await db.tbl_store_schedule.findFirst({
                  where: {
                    store_id: store.id,

                    work_date: today,

                    status: {
                      in: [
                        "SCHEDULED",
                        "OPEN",
                      ],
                    },

                    // ★ XE HÔM NAY PHẢI CÓ MENU
                    menu_id: {
                      not: null,
                    },
                  },

                  orderBy: [
                    {
                      open_time: "asc",
                    },
                    {
                      created_at: "desc",
                    },
                  ],

                  select: {
                    id: true,
                    menu_id: true,

                    location_name: true,
                    address: true,
                    google_map_url: true,

                    open_time: true,
                    close_time: true,

                    latitude: true,
                    longitude: true,

                    pickup_note: true,

                    status: true,
                  },
                });

              console.log(
                "[getActiveStores] Truck today's schedule:",
                {
                  storeId: store.id,
                  store: store.title,
                  today:
                    today.toISOString(),
                  menuId:
                    schedule?.menu_id ??
                    null,
                  locationName:
                    schedule?.location_name ??
                    null,
                }
              );

              // ★ Không có schedule/menu hôm nay
              // thì không đưa Truck vào active stores
              if (
                !schedule ||
                schedule.menu_id === null
              ) {
                return null;
              }

              return {
                id: store.id,

                title: store.title,

                slug: store.slug,

                type: store.type,

                color: store.color,

                // MENU HÔM NAY
                menuId: schedule.menu_id,

                // LOCATION HÔM NAY
                locationName:
                  schedule.location_name?.trim() ||
                  null,

                address:
                  schedule.address?.trim() ||
                  store.address,

                googleMapUrl:
                  schedule.google_map_url ||
                  store.google_map_url,

                openTime:
                  schedule.open_time ||
                  store.open_time,

                closeTime:
                  schedule.close_time ||
                  store.close_time,

                latitude:
                  schedule.latitude !== null
                    ? Number(schedule.latitude)
                    : store.latitude !== null
                    ? Number(store.latitude)
                    : null,

                longitude:
                  schedule.longitude !== null
                    ? Number(schedule.longitude)
                    : store.longitude !== null
                    ? Number(store.longitude)
                    : null,

                acceptingOrders:
                  store.accepting_orders,

                orderStatusDate:
                  store.order_status_date,

                orderStopReason:
                  store.order_stop_reason,

                orderStoppedAt:
                  store.order_stopped_at,

                orderReopenAt:
                  store.order_reopen_at,
              };
            }

            return null;
          } catch (storeError) {
            console.error(
              "[getActiveStores] PROCESS STORE ERROR:",
              store.id,
              storeError
            );

            return null;
          }
        }
      )
    );

    const cleanResult: StoreResult[] =
      result.filter(
        (
          store
        ): store is StoreResult =>
          store !== null
      );

    return safeJson(cleanResult);
  } catch (error) {
    console.error(
      "[getActiveStores] MAIN ERROR:",
      error
    );

    return [];
  }
}

// ============================================================
// 2. STORE INFO BY ID
// ============================================================

export async function getStoreInfo(
  storeId: number
) {
  try {
    const store =
      await db.tbl_store.findUnique({
        where: {
          id: storeId,
        },

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
        },
      });

    if (!store) {
      return null;
    }

    // ========================================================
    // SLUG SAFETY
    // ========================================================

    if (!store.slug) {
      console.warn(
        "[getStoreInfo] Store has no slug:",
        store.id,
        store.title
      );

      return null;
    }

    // ========================================================
    // SHOP
    // ========================================================

    if (store.type === "Shop") {
      return safeJson({
        id: store.id,

        name: store.title,
        title: store.title,

        slug: store.slug,

        type: store.type,

        address: store.address,

        googleMapUrl:
          store.google_map_url,

        phone: store.phone,

        openTime: store.open_time,
        closeTime: store.close_time,

        latitude:
          store.latitude !== null
            ? Number(store.latitude)
            : null,

        longitude:
          store.longitude !== null
            ? Number(store.longitude)
            : null,

        pickupNote: store.pickup_note,
      });
    }

    // ========================================================
    // TRUCK
    // ========================================================

    if (store.type === "Truck") {
      const today =
        getJapanTodayDate();

      let schedule =
        await db.tbl_store_schedule.findFirst(
          {
            where: {
              store_id: store.id,

              // ★ FIX
              // menu_id phải khác null
              menu_id: {
                not: null,
              },

              work_date: today,

              status: {
                in: [
                  "SCHEDULED",
                  "OPEN",
                ],
              },
            },

            orderBy: {
              created_at: "desc",
            },

            select: {
              menu_id: true,

              location_name: true,
              address: true,
              google_map_url: true,

              open_time: true,
              close_time: true,

              latitude: true,
              longitude: true,

              pickup_note: true,
            },
          }
        );

      // ======================================================
      // FALLBACK
      // ======================================================

      if (!schedule) {
        schedule =
          await db.tbl_store_schedule.findFirst(
            {
              where: {
                store_id: store.id,

                // ★ FIX
                menu_id: {
                  not: null,
                },

                work_date: today,
              },

              orderBy: {
                created_at: "desc",
              },

              select: {
                menu_id: true,

                location_name: true,
                address: true,
                google_map_url: true,

                open_time: true,
                close_time: true,

                latitude: true,
                longitude: true,

                pickup_note: true,
              },
            }
          );
      }

      return safeJson({
        id: store.id,

        name: store.title,
        title: store.title,

        slug: store.slug,

        type: store.type,

        menuId:
          schedule?.menu_id ??
          null,

        locationName:
          schedule?.location_name?.trim() ||
          null,

        address:
          schedule?.address?.trim() ||
          store.address,

        googleMapUrl:
          schedule?.google_map_url ||
          store.google_map_url,

        phone: store.phone,

        openTime:
          schedule?.open_time ||
          store.open_time,

        closeTime:
          schedule?.close_time ||
          store.close_time,

        latitude:
          schedule?.latitude !== null &&
          schedule?.latitude !== undefined
            ? Number(schedule.latitude)
            : store.latitude !== null
            ? Number(store.latitude)
            : null,

        longitude:
          schedule?.longitude !== null &&
          schedule?.longitude !== undefined
            ? Number(schedule.longitude)
            : store.longitude !== null
            ? Number(store.longitude)
            : null,

        pickupNote:
          schedule?.pickup_note ??
          store.pickup_note,
      });
    }

    return null;
  } catch (error) {
    console.error(
      "[getStoreInfo] ERROR:",
      error
    );

    return null;
  }
}

// ============================================================
// 2.1 STORE INFO BY SLUG
// ============================================================

export async function getStoreInfoBySlug(
  slug: string
) {
  try {
    const store =
      await db.tbl_store.findUnique({
        where: {
          slug,
        },

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

          // ORDER STATUS
          accepting_orders: true,
          order_status_date: true,
          order_stop_reason: true,
          order_stopped_at: true,
          order_reopen_at: true,
        },
      });

    if (!store) {
      return null;
    }

    // ========================================================
    // SLUG SAFETY
    // ========================================================

    if (!store.slug) {
      console.error(
        "[getStoreInfoBySlug] Store slug is null:",
        store.id
      );

      return null;
    }

    // ========================================================
    // SHOP
    // ========================================================

    if (store.type === "Shop") {
      return safeJson({
        id: store.id,

        name: store.title,
        title: store.title,

        slug: store.slug,

        type: store.type,

        menuId: null,

        address: store.address,

        googleMapUrl:
          store.google_map_url,

        phone: store.phone,

        openTime: store.open_time,
        closeTime: store.close_time,

        latitude:
          store.latitude !== null
            ? Number(store.latitude)
            : null,

        longitude:
          store.longitude !== null
            ? Number(store.longitude)
            : null,

        pickupNote:
          store.pickup_note,

        // ORDER STATUS
        acceptingOrders:
          store.accepting_orders,

        orderStatusDate:
          store.order_status_date,

        orderStopReason:
          store.order_stop_reason,

        orderStoppedAt:
          store.order_stopped_at,

        orderReopenAt:
          store.order_reopen_at,
      });
    }

    // ========================================================
    // TRUCK
    // ========================================================

    if (store.type === "Truck") {
      const today =
        getJapanTodayDate();

      console.log(
        "[getStoreInfoBySlug] ================================="
      );

      console.log(
        "[getStoreInfoBySlug] Truck:",
        store.id,
        store.title
      );

      console.log(
        "[getStoreInfoBySlug] Japan today:",
        today.toISOString()
      );

      // ======================================================
      // 1. LẤY SCHEDULE HÔM NAY
      // ======================================================

      let schedule =
        await db.tbl_store_schedule.findFirst(
          {
            where: {
              store_id: store.id,

              work_date: today,

              status: {
                in: [
                  "SCHEDULED",
                  "OPEN",
                ],
              },
            },

            orderBy: [
              {
                open_time: "asc",
              },
              {
                created_at: "desc",
              },
            ],

            select: {
              id: true,

              menu_id: true,

              location_id: true,
              location_name: true,

              address: true,
              google_map_url: true,

              open_time: true,
              close_time: true,

              last_order_time: true,

              accepting_orders: true,

              latitude: true,
              longitude: true,

              pickup_note: true,

              status: true,
            },
          }
        );

      // ======================================================
      // 2. FALLBACK
      // ======================================================

      if (!schedule) {
        schedule =
          await db.tbl_store_schedule.findFirst(
            {
              where: {
                store_id: store.id,

                work_date: today,
              },

              orderBy: {
                created_at: "desc",
              },

              select: {
                id: true,

                menu_id: true,

                location_id: true,
                location_name: true,

                address: true,
                google_map_url: true,

                open_time: true,
                close_time: true,

                last_order_time: true,

                accepting_orders: true,

                latitude: true,
                longitude: true,

                pickup_note: true,

                status: true,
              },
            }
          );
      }

      // ======================================================
      // DEBUG
      // ======================================================

      console.log(
        "[getStoreInfoBySlug] Truck schedule result:",
        {
          storeId: store.id,

          storeName: store.title,

          today:
            today.toISOString(),

          scheduleId:
            schedule?.id ?? null,

          menuId:
            schedule?.menu_id ?? null,

          locationId:
            schedule?.location_id ??
            null,

          locationName:
            schedule?.location_name ??
            null,

          status:
            schedule?.status ?? null,
        }
      );

      // ======================================================
      // RETURN
      // ======================================================

      return safeJson({
        id: store.id,

        name: store.title,
        title: store.title,

        slug: store.slug,

        type: store.type,

        // MENU HÔM NAY
        menuId:
          schedule?.menu_id ??
          null,

        // ====================================================
        // ĐỊA ĐIỂM
        // ====================================================

        locationName:
          schedule?.location_name?.trim() ||
          null,

        address:
          schedule?.address?.trim() ||
          store.address,

        googleMapUrl:
          schedule?.google_map_url ||
          store.google_map_url,

        // ====================================================
        // STORE
        // ====================================================

        phone: store.phone,

        openTime:
          schedule?.open_time ||
          store.open_time,

        closeTime:
          schedule?.close_time ||
          store.close_time,

        latitude:
          schedule?.latitude !== null &&
          schedule?.latitude !== undefined
            ? Number(schedule.latitude)
            : store.latitude !== null
            ? Number(store.latitude)
            : null,

        longitude:
          schedule?.longitude !== null &&
          schedule?.longitude !== undefined
            ? Number(schedule.longitude)
            : store.longitude !== null
            ? Number(store.longitude)
            : null,

        pickupNote:
          schedule?.pickup_note ??
          store.pickup_note,

        // ====================================================
        // ORDER STATUS
        // ====================================================

        acceptingOrders:
          store.accepting_orders,

        orderStatusDate:
          store.order_status_date,

        orderStopReason:
          store.order_stop_reason,

        orderStoppedAt:
          store.order_stopped_at,

        orderReopenAt:
          store.order_reopen_at,
      });
    }

    return null;
  } catch (error) {
    console.error(
      "[getStoreInfoBySlug] ERROR:",
      error
    );

    return null;
  }
}

// ============================================================
// 3. MENU CATEGORIES
// ============================================================

export async function getMenuCategories(
  storeId?: number,
  menuId?: number
) {
  try {
    const categories =
      await db.tbl_menu_category.findMany(
        {
          where: {
            tbl_menu_item: {
              some: {
                status: {
                  in: [
                    "ACTIVE",
                    "PAUSED",
                  ],
                },

                tbl_menu: {
                  is_active: true,

                  ...(storeId !== undefined
                    ? {
                        store_id:
                          storeId,
                      }
                    : {}),

                  ...(menuId !== undefined
                    ? {
                        id: menuId,
                      }
                    : {}),
                },
              },
            },
          },

          orderBy: {
            display_order: "asc",
          },
        }
      );

    console.log(
      "[getMenuCategories]",
      {
        storeId,
        menuId,

        count:
          categories.length,

        categoryIds:
          categories.map(
            (category) =>
              category.id
          ),
      }
    );

    return safeJson(
      categories
    );
  } catch (error) {
    console.error(
      "[getMenuCategories] ERROR:",
      error
    );

    return [];
  }
}

// ============================================================
// 4. MENU ITEMS
// ============================================================

export async function getMenuItems(
  storeId?: number,
  menuId?: number
) {
  try {
    const items = await db.tbl_menu_item.findMany({
      where: {
        status: {
          in: ["ACTIVE", "PAUSED"],
        },

        tbl_menu: {
          is_active: true,

          ...(storeId !== undefined
            ? {
                store_id: storeId,
              }
            : {}),

          ...(menuId !== undefined
            ? {
                id: menuId,
              }
            : {}),
        },
      },

      include: {
        // ======================================================
        // VARIANTS
        // ======================================================
        tbl_menu_item_variants: true,

        // ======================================================
        // TAGS
        // ======================================================
        tbl_menu_item_tag: {
          include: {
            tbl_tag: true,
          },

          orderBy: {
            tbl_tag: {
              sort_order: "asc",
            },
          },
        },
      },

      orderBy: {
        display_order: "asc",
      },
    });

    // ==========================================================
    // DEBUG RAW TAG
    // ==========================================================

    console.log(
      "[getMenuItems] RAW:",
      items.map((item) => ({
        itemId: item.id,
        name: item.name_ja,

        tagRelations: item.tbl_menu_item_tag?.map(
          (relation) => ({
            tagId: relation.tag_id,
            tag: relation.tbl_tag
              ? {
                  id: relation.tbl_tag.id,
                  code: relation.tbl_tag.code,
                  name_ja: relation.tbl_tag.name_ja,
                  name_vi: relation.tbl_tag.name_vi,
                  name_en: relation.tbl_tag.name_en,
                  name_zh: relation.tbl_tag.name_zh,
                  color: relation.tbl_tag.color,
                  icon: relation.tbl_tag.icon,
                  sort_order: relation.tbl_tag.sort_order,
                  is_active: relation.tbl_tag.is_active,
                }
              : null,
          })
        ),
      }))
    );

    // ==========================================================
    // NORMALIZE DATA
    // ==========================================================
    //
    // Không trả nguyên relation phức tạp cho frontend.
    // Tạo thêm `tags` dạng đơn giản:
    //
    // item.tags = [
    //   {
    //     id,
    //     code,
    //     name_ja,
    //     name_vi,
    //     name_en,
    //     name_zh,
    //     color,
    //     icon
    //   }
    // ]
    //
    // Frontend sẽ đọc item.tags.
    // ==========================================================

    const normalizedItems = items.map((item) => {
      const tags = (item.tbl_menu_item_tag ?? [])
        .map((relation) => relation.tbl_tag)
        .filter(
          (tag): tag is NonNullable<typeof tag> =>
            tag !== null &&
            Number(tag.is_active ?? 1) === 1
        )
        .map((tag) => ({
          id: tag.id,
          code: tag.code,

          name_ja: tag.name_ja,
          name_vi: tag.name_vi,
          name_en: tag.name_en,
          name_zh: tag.name_zh,

          color: tag.color,
          icon: tag.icon,

          sort_order: tag.sort_order,
          is_active: tag.is_active,
        }));

      return {
        ...item,

        // ⭐ FRONTEND DÙNG CÁI NÀY
        tags,
      };
    });

    console.log(
      "[getMenuItems] RESULT:",
      normalizedItems.map((item) => ({
        itemId: item.id,
        name: item.name_ja,
        tags: item.tags,
      }))
    );

    return safeJson(normalizedItems);
  } catch (error) {
    console.error(
      "[getMenuItems] ERROR:",
      error
    );

    return [];
  }
}
