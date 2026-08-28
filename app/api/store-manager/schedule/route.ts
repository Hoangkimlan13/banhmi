import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// TYPES
// ============================================================

type ScheduleType =
  | "LOCATION"
  | "EVENT"
  | "CLOSED";

type ScheduleStatus =
  | "SCHEDULED"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED"
  | "COMPLETED";

// ============================================================
// HELPERS
// ============================================================

async function getStoreId(): Promise<number> {
  const session = await getStoreSession();

  if (!session || !session.storeId) {
    throw new Error("店舗セッションがありません。");
  }

  return Number(session.storeId);
}

/**
 * "11:00" / "11:00:00"
 * → Prisma DateTime(@db.Time)
 */
function timeToDate(
  value: string | null | undefined
): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    throw new Error(
      `時刻の形式が正しくありません: ${value}`
    );
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? "0");

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new Error(
      `時刻の値が正しくありません: ${value}`
    );
  }

  return new Date(
    `1970-01-01T${String(hour).padStart(2, "0")}:${String(
      minute
    ).padStart(2, "0")}:${String(second).padStart(
      2,
      "0"
    )}.000Z`
  );
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(
      "日付の形式が正しくありません。"
    );
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function cleanNullableString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function toNumberOrNull(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

// ============================================================
// GET
// ============================================================

export async function GET(
  request: Request
) {
  try {
    const storeId = await getStoreId();

    const { searchParams } =
      new URL(request.url);

    const from =
      searchParams.get("from");

    const to =
      searchParams.get("to");

    // --------------------------------------------------------
    // SCHEDULES
    // --------------------------------------------------------

    const schedules =
      await db.tbl_store_schedule.findMany({
        where: {
          store_id: storeId,

          ...(from || to
            ? {
                work_date: {
                  ...(from
                    ? {
                        gte: parseDate(from),
                      }
                    : {}),
                  ...(to
                    ? {
                        lte: parseDate(to),
                      }
                    : {}),
                },
              }
            : {}),
        },

        orderBy: {
          work_date: "asc",
        },

        include: {
          tbl_store_location: true,
          tbl_menu: true,
        },
      });

    // --------------------------------------------------------
    // ACTIVE LOCATIONS
    // --------------------------------------------------------

    const locations =
      await db.tbl_store_location.findMany({
        where: {
          store_id: storeId,
          is_active: true,
        },

        orderBy: {
          name: "asc",
        },
      });

    // --------------------------------------------------------
    // MENUS
    // --------------------------------------------------------

    const menus =
      await db.tbl_menu.findMany({
        where: {
          store_id: storeId,
          is_active: true,
        },

        orderBy: [
          {
            is_default: "desc",
          },
          {
            name: "asc",
          },
        ],

        select: {
          id: true,
          name: true,
          is_default: true,
          is_active: true,
        },
      });

    return NextResponse.json({
      success: true,
      schedules,
      locations,
      menus,
    });
  } catch (error) {
    console.error(
      "[GET /api/store-manager/schedule]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業スケジュールの取得に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST
// 新しい日程を登録
// ============================================================

export async function POST(
  request: Request
) {
  try {
    const storeId = await getStoreId();

    const body = await request.json();

    const {
      work_date,
      schedule_type,
      location_id,
      menu_id,
      location_name,
      address,
      google_map_url,
      open_time,
      close_time,
      last_order_time,
      accepting_orders,
      status,
      close_reason,
      note,
      pickup_note,
      latitude,
      longitude,
    } = body;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!work_date) {
      return NextResponse.json(
        {
          success: false,
          message: "営業日を選択してください。",
        },
        { status: 400 }
      );
    }

    const validTypes: ScheduleType[] = [
      "LOCATION",
      "EVENT",
      "CLOSED",
    ];

    if (
      !validTypes.includes(
        schedule_type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "営業区分が正しくありません。",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------------
    // DUPLICATE CHECK
    // --------------------------------------------------------

    const date =
      parseDate(work_date);

    const existing =
      await db.tbl_store_schedule.findUnique(
        {
          where: {
            store_id_work_date: {
              store_id: storeId,
              work_date: date,
            },
          },
        }
      );

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "この営業日にはすでにスケジュールが登録されています。",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    let location = null;

    if (location_id) {
      location =
        await db.tbl_store_location.findFirst({
          where: {
            id: Number(location_id),
            store_id: storeId,
            is_active: true,
          },
        });

      if (!location) {
        return NextResponse.json(
          {
            success: false,
            message:
              "選択した販売場所が見つかりません。",
          },
          { status: 400 }
        );
      }
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const schedule =
      await db.tbl_store_schedule.create({
        data: {
          store_id: storeId,

          location_id:
            location?.id ?? null,

          menu_id:
            menu_id
              ? Number(menu_id)
              : null,

          work_date: date,

          schedule_type,

          // LOCATIONを選んだ場合は
          // location master から自動取得
          location_name:
            location?.name ??
            cleanNullableString(
              location_name
            ),

          address:
            location?.address ??
            cleanNullableString(address),

          google_map_url:
            location?.google_map_url ??
            cleanNullableString(
              google_map_url
            ),

          open_time: timeToDate(
            open_time ??
              location?.default_open_time
                ?.toISOString()
                .slice(11, 16)
          ),

          close_time: timeToDate(
            close_time ??
              location?.default_close_time
                ?.toISOString()
                .slice(11, 16)
          ),

          last_order_time: timeToDate(
            last_order_time ??
              location?.default_last_order_time
                ?.toISOString()
                .slice(11, 16)
          ),

          accepting_orders:
            accepting_orders !== false,

          status:
            status || "SCHEDULED",

          close_reason:
            cleanNullableString(
              close_reason
            ),

          note:
            cleanNullableString(note),

          pickup_note:
            location?.pickup_note ??
            cleanNullableString(
              pickup_note
            ),

          latitude:
            location?.latitude ??
            toNumberOrNull(latitude),

          longitude:
            location?.longitude ??
            toNumberOrNull(longitude),
        },

        include: {
          tbl_store_location: true,
          tbl_menu: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "営業スケジュールを登録しました。",
      schedule,
    });
  } catch (error) {
    console.error(
      "[POST /api/store-manager/schedule]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業スケジュールの登録に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT
// スケジュール編集
// ============================================================

export async function PUT(
  request: Request
) {
  try {
    const storeId = await getStoreId();

    const body = await request.json();

    const {
      id,
      work_date,
      schedule_type,
      location_id,
      menu_id,
      location_name,
      address,
      google_map_url,
      open_time,
      close_time,
      last_order_time,
      accepting_orders,
      status,
      close_reason,
      note,
      pickup_note,
      latitude,
      longitude,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "スケジュールIDがありません。",
        },
        { status: 400 }
      );
    }

    const existing =
      await db.tbl_store_schedule.findFirst({
        where: {
          id: Number(id),
          store_id: storeId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "スケジュールが見つかりません。",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------------
    // LOCATION
    // --------------------------------------------------------

    let location = null;

    if (location_id) {
      location =
        await db.tbl_store_location.findFirst({
          where: {
            id: Number(location_id),
            store_id: storeId,
            is_active: true,
          },
        });

      if (!location) {
        return NextResponse.json(
          {
            success: false,
            message:
              "選択した販売場所が見つかりません。",
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...(work_date
        ? {
            work_date:
              parseDate(work_date),
          }
        : {}),

      schedule_type:
        schedule_type ??
        existing.schedule_type,

      location_id:
        location?.id ??
        (location_id === null
          ? null
          : existing.location_id),

      menu_id:
        menu_id === null ||
        menu_id === ""
          ? null
          : menu_id !== undefined
          ? Number(menu_id)
          : existing.menu_id,

      location_name:
        location?.name ??
        cleanNullableString(
          location_name
        ),

      address:
        location?.address ??
        cleanNullableString(address),

      google_map_url:
        location?.google_map_url ??
        cleanNullableString(
          google_map_url
        ),

      open_time: timeToDate(
        open_time ??
          location?.default_open_time
            ?.toISOString()
            .slice(11, 16)
      ),

      close_time: timeToDate(
        close_time ??
          location?.default_close_time
            ?.toISOString()
            .slice(11, 16)
      ),

      last_order_time: timeToDate(
        last_order_time ??
          location?.default_last_order_time
            ?.toISOString()
            .slice(11, 16)
      ),

      accepting_orders:
        accepting_orders !== false,

      status:
        status ??
        existing.status,

      close_reason:
        cleanNullableString(
          close_reason
        ),

      note:
        cleanNullableString(note),

      pickup_note:
        location?.pickup_note ??
        cleanNullableString(
          pickup_note
        ),

      latitude:
        location?.latitude ??
        toNumberOrNull(latitude),

      longitude:
        location?.longitude ??
        toNumberOrNull(longitude),
    };

    const schedule =
      await db.tbl_store_schedule.update({
        where: {
          id: Number(id),
        },

        data: updateData,

        include: {
          tbl_store_location: true,
          tbl_menu: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "営業スケジュールを更新しました。",
      schedule,
    });
  } catch (error) {
    console.error(
      "[PUT /api/store-manager/schedule]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業スケジュールの更新に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE
// ============================================================

export async function DELETE(
  request: Request
) {
  try {
    const storeId = await getStoreId();

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "スケジュールIDがありません。",
        },
        { status: 400 }
      );
    }

    const existing =
      await db.tbl_store_schedule.findFirst({
        where: {
          id: Number(id),
          store_id: storeId,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "スケジュールが見つかりません。",
        },
        { status: 404 }
      );
    }

    await db.tbl_store_schedule.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "営業スケジュールを削除しました。",
    });
  } catch (error) {
    console.error(
      "[DELETE /api/store-manager/schedule]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業スケジュールの削除に失敗しました。",
      },
      { status: 500 }
    );
  }
}