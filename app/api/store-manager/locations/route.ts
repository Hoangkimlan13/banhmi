import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// TYPES
// ============================================================

type LocationInput = {
  name?: string;

  address?: string | null;

  google_map_url?: string | null;

  latitude?: number | string | null;

  longitude?: number | string | null;

  default_open_time?: string | null;

  default_close_time?: string | null;

  default_last_order_time?: string | null;

  pickup_note?: string | null;

  note?: string | null;
};

// ============================================================
// HELPERS
// ============================================================

function cleanString(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const result = value.trim();

  return result || null;
}

// ------------------------------------------------------------
// TIME -> Prisma DateTime
//
// DB field is DateTime.
// We use a fixed date because these values represent
// "time of day", not an actual calendar date.
//
// Example:
// "10:00"
// ->
// 1970-01-01T10:00:00.000Z
// ------------------------------------------------------------

function timeToDateTime(
  value: unknown
): Date | null {
  const time = cleanString(value);

  if (!time) {
    return null;
  }

  const match = time.match(
    /^(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(
    match[3] ?? "0"
  );

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  // IMPORTANT:
  // Use UTC explicitly so 10:00 remains 10:00
  // when Prisma serializes it back to ISO.
  return new Date(
    `1970-01-01T${String(hour).padStart(
      2,
      "0"
    )}:${String(minute).padStart(
      2,
      "0"
    )}:${String(second).padStart(
      2,
      "0"
    )}.000Z`
  );
}

// ------------------------------------------------------------
// Decimal
// ------------------------------------------------------------

function parseDecimal(
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

// ------------------------------------------------------------
// Serialize
// ------------------------------------------------------------

function serialize<T>(
  data: T
): T {
  return JSON.parse(
    JSON.stringify(
      data,
      (_, value) =>
        typeof value === "bigint"
          ? value.toString()
          : value
    )
  );
}

// ============================================================
// GET
// ============================================================

export async function GET() {
  try {
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const locations =
      await db.tbl_store_location.findMany(
        {
          where: {
            store_id:
              session.storeId,
          },

          orderBy: {
            id: "asc",
          },
        }
      );

    return NextResponse.json({
      success: true,

      locations:
        serialize(locations),
    });
  } catch (error) {
    console.error(
      "[LOCATIONS GET]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "販売場所の取得に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(
  request: Request
) {
  try {
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as LocationInput;

    const name =
      cleanString(body.name);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所名を入力してください。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // TIME VALIDATION
    // --------------------------------------------------------

    const openTime =
      body.default_open_time
        ? timeToDateTime(
            body.default_open_time
          )
        : null;

    const closeTime =
      body.default_close_time
        ? timeToDateTime(
            body.default_close_time
          )
        : null;

    const lastOrderTime =
      body.default_last_order_time
        ? timeToDateTime(
            body.default_last_order_time
          )
        : null;

    if (
      body.default_open_time &&
      !openTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "開店時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.default_close_time &&
      !closeTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "閉店時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.default_last_order_time &&
      !lastOrderTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ラストオーダー時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const location =
      await db.tbl_store_location.create(
        {
          data: {
            store_id:
              session.storeId,

            name,

            address:
              cleanString(
                body.address
              ),

            google_map_url:
              cleanString(
                body.google_map_url
              ),

            latitude:
              parseDecimal(
                body.latitude
              ),

            longitude:
              parseDecimal(
                body.longitude
              ),

            default_open_time:
              openTime,

            default_close_time:
              closeTime,

            default_last_order_time:
              lastOrderTime,

            pickup_note:
              cleanString(
                body.pickup_note
              ),

            note:
              cleanString(
                body.note
              ),
          },
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "販売場所を登録しました。",

      location:
        serialize(location),
    });
  } catch (error) {
    console.error(
      "[LOCATIONS POST]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "販売場所の登録に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// PUT
// ============================================================

export async function PUT(
  request: Request
) {
  try {
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as LocationInput & {
        id?: number;
      };

    const id =
      Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所IDが不正です。",
        },
        {
          status: 400,
        }
      );
    }

    const name =
      cleanString(body.name);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所名を入力してください。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // CHECK OWNERSHIP
    // --------------------------------------------------------

    const existing =
      await db.tbl_store_location.findFirst(
        {
          where: {
            id,

            store_id:
              session.storeId,
          },
        }
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所が見つかりません。",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // TIME
    // --------------------------------------------------------

    const openTime =
      body.default_open_time
        ? timeToDateTime(
            body.default_open_time
          )
        : null;

    const closeTime =
      body.default_close_time
        ? timeToDateTime(
            body.default_close_time
          )
        : null;

    const lastOrderTime =
      body.default_last_order_time
        ? timeToDateTime(
            body.default_last_order_time
          )
        : null;

    if (
      body.default_open_time &&
      !openTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "開店時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.default_close_time &&
      !closeTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "閉店時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.default_last_order_time &&
      !lastOrderTime
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ラストオーダー時間の形式が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    const location =
      await db.tbl_store_location.update(
        {
          where: {
            id,
          },

          data: {
            name,

            address:
              cleanString(
                body.address
              ),

            google_map_url:
              cleanString(
                body.google_map_url
              ),

            latitude:
              parseDecimal(
                body.latitude
              ),

            longitude:
              parseDecimal(
                body.longitude
              ),

            default_open_time:
              openTime,

            default_close_time:
              closeTime,

            default_last_order_time:
              lastOrderTime,

            pickup_note:
              cleanString(
                body.pickup_note
              ),

            note:
              cleanString(
                body.note
              ),
          },
        }
      );

    return NextResponse.json({
      success: true,

      message:
        "販売場所を更新しました。",

      location:
        serialize(location),
    });
  } catch (error) {
    console.error(
      "[LOCATIONS PUT]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "販売場所の更新に失敗しました。",
      },
      {
        status: 500,
      }
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
    const session =
      await getStoreSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const url =
      new URL(request.url);

    const id =
      Number(
        url.searchParams.get("id")
      );

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所IDが不正です。",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await db.tbl_store_location.findFirst(
        {
          where: {
            id,

            store_id:
              session.storeId,
          },
        }
      );

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "販売場所が見つかりません。",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------------
    // USED BY SCHEDULE?
    // --------------------------------------------------------

    const used =
      await db.tbl_store_schedule.findFirst(
        {
          where: {
            location_id: id,

            store_id:
              session.storeId,
          },

          select: {
            id: true,
          },
        }
      );

    if (used) {
      return NextResponse.json(
        {
          success: false,

          message:
            "この販売場所は営業スケジュールで使用されているため削除できません。名称や営業時間を変更してください。",
        },
        {
          status: 409,
        }
      );
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    await db.tbl_store_location.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json({
      success: true,

      message:
        "販売場所を削除しました。",
    });
  } catch (error) {
    console.error(
      "[LOCATIONS DELETE]",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "販売場所の削除に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}