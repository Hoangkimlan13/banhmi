import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// GET
// 店舗設定取得
// ============================================================

export async function GET() {
  try {
    const session = await getStoreSession();

    console.log("[STORE_SETTINGS_GET] session =", session);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗ログインが必要です。",
        },
        { status: 401 }
      );
    }

    // ★ getStoreSession() trả về object
    const storeId = session.storeId;

    console.log("[STORE_SETTINGS_GET] storeId =", storeId);

    const store = await db.tbl_store.findUnique({
      where: {
        id: storeId,
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

        pickup_note: true,
        accepting_orders: true,

        latitude: true,
        longitude: true,

        order_status_date: true,
        order_stop_reason: true,
        order_stopped_at: true,
        order_reopen_at: true,
      },
    });

    console.log("[STORE_SETTINGS_GET] store =", store);

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗情報が見つかりません。",
        },
        { status: 404 }
      );
    }

    // ========================================================
    // Prisma Date / Decimal → JSON safe
    // ========================================================

    const serializedStore = {
      ...store,

      open_time: store.open_time
        ? store.open_time.toISOString()
        : null,

      close_time: store.close_time
        ? store.close_time.toISOString()
        : null,

      order_status_date: store.order_status_date
        ? store.order_status_date.toISOString()
        : null,

      order_stopped_at: store.order_stopped_at
        ? store.order_stopped_at.toISOString()
        : null,

      order_reopen_at: store.order_reopen_at
        ? store.order_reopen_at.toISOString()
        : null,

      latitude:
        store.latitude !== null
          ? Number(store.latitude)
          : null,

      longitude:
        store.longitude !== null
          ? Number(store.longitude)
          : null,
    };

    return NextResponse.json({
      success: true,
      store: serializedStore,
    });
  } catch (error) {
    console.error("[STORE_SETTINGS_GET]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "店舗情報の取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT
// 店舗設定更新
// ============================================================

export async function PUT(request: Request) {
  try {
    const session = await getStoreSession();

    console.log("[STORE_SETTINGS_PUT] session =", session);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗ログインが必要です。",
        },
        { status: 401 }
      );
    }

    // ★ ここも必ず .storeId
    const storeId = session.storeId;

    const body = await request.json();

    const {
      title,
      address,
      google_map_url,
      phone,
      open_time,
      close_time,
      pickup_note,
      accepting_orders,
      color,
      latitude,
      longitude,
    } = body;

    // ========================================================
    // Validation
    // ========================================================

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        title.trim().length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "店舗名を入力してください。",
          },
          { status: 400 }
        );
      }

      if (title.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            message:
              "店舗名は100文字以内で入力してください。",
          },
          { status: 400 }
        );
      }
    }

    if (
      open_time !== undefined &&
      open_time !== null &&
      open_time !== ""
    ) {
      if (!/^\d{2}:\d{2}$/.test(open_time)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "開店時間の形式が正しくありません。",
          },
          { status: 400 }
        );
      }
    }

    if (
      close_time !== undefined &&
      close_time !== null &&
      close_time !== ""
    ) {
      if (!/^\d{2}:\d{2}$/.test(close_time)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "閉店時間の形式が正しくありません。",
          },
          { status: 400 }
        );
      }
    }

    // ========================================================
    // Update
    // ========================================================

    const store = await db.tbl_store.update({
      where: {
        id: storeId,
      },

      data: {
        ...(title !== undefined
          ? {
              title: title.trim(),
            }
          : {}),

        ...(address !== undefined
          ? {
              address:
                address === null || address === ""
                  ? null
                  : String(address).trim(),
            }
          : {}),

        ...(google_map_url !== undefined
          ? {
              google_map_url:
                google_map_url === null ||
                google_map_url === ""
                  ? null
                  : String(google_map_url).trim(),
            }
          : {}),

        ...(phone !== undefined
          ? {
              phone:
                phone === null || phone === ""
                  ? null
                  : String(phone).trim(),
            }
          : {}),

        ...(open_time !== undefined
          ? {
              open_time:
                open_time === null || open_time === ""
                  ? null
                  : new Date(
                      `1970-01-01T${open_time}:00Z`
                    ),
            }
          : {}),

        ...(close_time !== undefined
          ? {
              close_time:
                close_time === null || close_time === ""
                  ? null
                  : new Date(
                      `1970-01-01T${close_time}:00Z`
                    ),
            }
          : {}),

        ...(pickup_note !== undefined
          ? {
              pickup_note:
                pickup_note === null ||
                pickup_note === ""
                  ? null
                  : String(pickup_note),
            }
          : {}),

        ...(accepting_orders !== undefined
          ? {
              accepting_orders:
                Boolean(accepting_orders),
            }
          : {}),

        ...(color !== undefined
          ? {
              color:
                color === null || color === ""
                  ? null
                  : String(color),
            }
          : {}),

        ...(latitude !== undefined
          ? {
              latitude:
                latitude === null || latitude === ""
                  ? null
                  : latitude,
            }
          : {}),

        ...(longitude !== undefined
          ? {
              longitude:
                longitude === null || longitude === ""
                  ? null
                  : longitude,
            }
          : {}),
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
        pickup_note: true,
        accepting_orders: true,
        latitude: true,
        longitude: true,
      },
    });

    // ========================================================
    // Serialize
    // ========================================================

    const serializedStore = {
      ...store,

      open_time: store.open_time
        ? store.open_time.toISOString()
        : null,

      close_time: store.close_time
        ? store.close_time.toISOString()
        : null,

      latitude:
        store.latitude !== null
          ? Number(store.latitude)
          : null,

      longitude:
        store.longitude !== null
          ? Number(store.longitude)
          : null,
    };

    return NextResponse.json({
      success: true,
      message: "店舗設定を更新しました。",
      store: serializedStore,
    });
  } catch (error) {
    console.error("[STORE_SETTINGS_PUT]", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "店舗設定の更新に失敗しました。",
      },
      { status: 500 }
    );
  }
}