import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// TYPES
// ============================================================

type ScheduleType = "CLOSED" | "SPECIAL_OPEN";

// ============================================================
// HELPERS
// ============================================================

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return /^\d{2}:\d{2}$/.test(value);
}

function dateToUtc(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function timeToUtc(time: string): Date {
  return new Date(`1970-01-01T${time}:00.000Z`);
}

function serializeSchedule(schedule: {
  id: number;
  store_id: number;
  start_date: Date;
  end_date: Date;
  type: string;
  open_time: Date | null;
  close_time: Date | null;
  reason: string | null;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: schedule.id,
    store_id: schedule.store_id,

    start_date: schedule.start_date
      .toISOString()
      .slice(0, 10),

    end_date: schedule.end_date
      .toISOString()
      .slice(0, 10),

    type: schedule.type,

    open_time: schedule.open_time
      ? schedule.open_time.toISOString().slice(11, 16)
      : null,

    close_time: schedule.close_time
      ? schedule.close_time.toISOString().slice(11, 16)
      : null,

    reason: schedule.reason,
    note: schedule.note,

    created_at: schedule.created_at.toISOString(),
    updated_at: schedule.updated_at.toISOString(),
  };
}

// ============================================================
// GET
// 特別営業・休業一覧
// ============================================================

export async function GET() {
  try {
    const session = await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗ログインが必要です。",
        },
        { status: 401 }
      );
    }

    const storeId = session.storeId;

    const schedules =
      await db.tbl_store_special_schedule.findMany({
        where: {
          store_id: storeId,
        },

        orderBy: [
          {
            start_date: "asc",
          },
          {
            id: "asc",
          },
        ],
      });

    return NextResponse.json({
      success: true,
      schedules: schedules.map(serializeSchedule),
    });
  } catch (error) {
    console.error(
      "[SPECIAL_SCHEDULE_GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業カレンダーの取得に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST
// 特別営業・休業登録
// ============================================================

export async function POST(request: Request) {
  try {
    const session = await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗ログインが必要です。",
        },
        { status: 401 }
      );
    }

    const storeId = session.storeId;

    const body = await request.json();

    const {
      start_date,
      end_date,
      type,
      open_time,
      close_time,
      reason,
      note,
    } = body as {
      start_date?: unknown;
      end_date?: unknown;
      type?: unknown;
      open_time?: unknown;
      close_time?: unknown;
      reason?: unknown;
      note?: unknown;
    };

    // ========================================================
    // VALIDATION
    // ========================================================

    if (!isValidDate(start_date)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "開始日の形式が正しくありません。",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(end_date)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "終了日の形式が正しくありません。",
        },
        { status: 400 }
      );
    }

    const startDate = dateToUtc(start_date);
    const endDate = dateToUtc(end_date);

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "終了日は開始日以降にしてください。",
        },
        { status: 400 }
      );
    }

    if (
      type !== "CLOSED" &&
      type !== "SPECIAL_OPEN"
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

    // ========================================================
    // SPECIAL_OPEN の場合は営業時間必須
    // ========================================================

    if (type === "SPECIAL_OPEN") {
      if (!isValidTime(open_time)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "特別営業の開店時間を入力してください。",
          },
          { status: 400 }
        );
      }

      if (!isValidTime(close_time)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "特別営業の閉店時間を入力してください。",
          },
          { status: 400 }
        );
      }
    }

    // ========================================================
    // OVERLAP CHECK
    //
    // 同じ店舗で既存期間と重複する登録を防ぐ
    // ========================================================

    const overlapping =
      await db.tbl_store_special_schedule.findFirst({
        where: {
          store_id: storeId,

          start_date: {
            lte: endDate,
          },

          end_date: {
            gte: startDate,
          },
        },
      });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          message:
            "登録期間が既存の営業カレンダーと重複しています。",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // CREATE
    // ========================================================

    const schedule =
      await db.tbl_store_special_schedule.create({
        data: {
          store_id: storeId,

          start_date: startDate,
          end_date: endDate,

          type: type as ScheduleType,

          open_time:
            type === "SPECIAL_OPEN" &&
            isValidTime(open_time)
              ? timeToUtc(open_time)
              : null,

          close_time:
            type === "SPECIAL_OPEN" &&
            isValidTime(close_time)
              ? timeToUtc(close_time)
              : null,

          reason:
            typeof reason === "string" &&
            reason.trim()
              ? reason.trim()
              : null,

          note:
            typeof note === "string" &&
            note.trim()
              ? note.trim()
              : null,
        },
      });

    return NextResponse.json(
      {
        success: true,
        message:
          type === "CLOSED"
            ? "休業日を登録しました。"
            : "特別営業時間を登録しました。",

        schedule: serializeSchedule(schedule),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "[SPECIAL_SCHEDULE_POST]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業カレンダーの登録に失敗しました。",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE
// 特別営業・休業削除
//
// DELETE /api/store-manager/special-schedule?id=123
// ============================================================

export async function DELETE(
  request: Request
) {
  try {
    const session = await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "店舗ログインが必要です。",
        },
        { status: 401 }
      );
    }

    const storeId = session.storeId;

    const { searchParams } =
      new URL(request.url);

    const id = Number(
      searchParams.get("id")
    );

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "削除対象が正しくありません。",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // STORE OWNERSHIP CHECK
    // 店舗IDも条件に含める
    // ========================================================

    const schedule =
      await db.tbl_store_special_schedule.findFirst(
        {
          where: {
            id,
            store_id: storeId,
          },
        }
      );

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          message:
            "営業カレンダーが見つかりません。",
        },
        { status: 404 }
      );
    }

    await db.tbl_store_special_schedule.delete({
      where: {
        id: schedule.id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "営業カレンダーを削除しました。",
    });
  } catch (error) {
    console.error(
      "[SPECIAL_SCHEDULE_DELETE]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "営業カレンダーの削除に失敗しました。",
      },
      { status: 500 }
    );
  }
}