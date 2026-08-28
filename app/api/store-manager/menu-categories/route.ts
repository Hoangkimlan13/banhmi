import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";

import { getStoreSession } from "@/lib/store-session";

/* ============================================================
   TYPES
   ============================================================ */

type CreateCategoryBody = {
  menu_id?: unknown;
  name_ja?: unknown;
  name_vi?: unknown;
  name_en?: unknown;
  name_zh?: unknown;
  image_url?: unknown;
  is_active?: unknown;
};

/* ============================================================
   HELPERS
   ============================================================ */

function optionalString(
  value: unknown,
  maxLength: number
): string | null {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "string"
  ) {
    return null;
  }

  const valueTrimmed = value.trim();

  if (!valueTrimmed) {
    return null;
  }

  return valueTrimmed.slice(0, maxLength);
}

function serializeCategory(category: {
  id: number;
  menu_id: number;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  image_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: Date;
}) {
  return {
    id: Number(category.id),
    menu_id: Number(category.menu_id),

    name_ja: category.name_ja,

    name_vi: category.name_vi ?? null,
    name_en: category.name_en ?? null,
    name_zh: category.name_zh ?? null,

    image_url: category.image_url ?? null,

    display_order: Number(
      category.display_order ?? 0
    ),

    is_active: Boolean(
      category.is_active
    ),

    created_at:
      category.created_at.toISOString(),
  };
}

/* ============================================================
   GET
   GET /api/store-manager/menu-categories?menu_id=123
   ============================================================ */

export async function GET(
  request: Request
) {
  try {
    /* --------------------------------------------------------
       STORE SESSION
       -------------------------------------------------------- */

    const session = await getStoreSession();

    if (!session?.storeId) {
      return NextResponse.json(
        {
          error:
            "店舗ログイン情報がありません。",
        },
        {
          status: 401,
        }
      );
    }

    const storeId = Number(
      session.storeId
    );

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "店舗情報が不正です。",
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       MENU ID
       -------------------------------------------------------- */

    const url = new URL(
      request.url
    );

    const menuId = Number(
      url.searchParams.get(
        "menu_id"
      )
    );

    if (
      !Number.isInteger(menuId) ||
      menuId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "メニュー情報が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CHECK MENU BELONGS TO STORE
       -------------------------------------------------------- */

    const menu =
      await db.tbl_menu.findFirst({
        where: {
          id: menuId,
          store_id: storeId,
        },

        select: {
          id: true,
          store_id: true,
          is_active: true,
        },
      });

    if (!menu) {
      return NextResponse.json(
        {
          error:
            "このメニューを操作する権限がありません。",
        },
        {
          status: 403,
        }
      );
    }

    /* --------------------------------------------------------
       GET CATEGORIES
       -------------------------------------------------------- */

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

        select: {
          id: true,
          menu_id: true,

          name_ja: true,
          name_vi: true,
          name_en: true,
          name_zh: true,

          image_url: true,

          display_order: true,
          is_active: true,

          created_at: true,
        },
      });

    /* --------------------------------------------------------
       SERIALIZE
       -------------------------------------------------------- */

    const serializedCategories =
      categories.map(
        serializeCategory
      );

    /* --------------------------------------------------------
       RESPONSE
       -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        categories:
          serializedCategories,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[GET /api/store-manager/menu-categories]",
      error
    );

    return NextResponse.json(
      {
        error:
          "カテゴリの取得に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST
   POST /api/store-manager/menu-categories
   ============================================================ */

export async function POST(
  request: Request
) {
  try {
    /* --------------------------------------------------------
       STORE SESSION
       -------------------------------------------------------- */

    const session = await getStoreSession();

    if (!session?.storeId) {
      return NextResponse.json(
        {
          error:
            "店舗ログイン情報がありません。",
        },
        {
          status: 401,
        }
      );
    }

    const storeId = Number(
      session.storeId
    );

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "店舗情報が不正です。",
        },
        {
          status: 401,
        }
      );
    }

    /* --------------------------------------------------------
       BODY
       -------------------------------------------------------- */

    const body =
      (await request.json()) as CreateCategoryBody;

    const menuId = Number(
      body.menu_id
    );

    if (
      !Number.isInteger(menuId) ||
      menuId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "メニュー情報が不正です。",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CHECK MENU
       -------------------------------------------------------- */

    const menu =
      await db.tbl_menu.findFirst({
        where: {
          id: menuId,
          store_id: storeId,
        },

        select: {
          id: true,
          store_id: true,
          is_active: true,
        },
      });

    if (!menu) {
      return NextResponse.json(
        {
          error:
            "このメニューを操作する権限がありません。",
        },
        {
          status: 403,
        }
      );
    }

    if (!menu.is_active) {
      return NextResponse.json(
        {
          error:
            "無効なメニューにはカテゴリを追加できません。",
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CATEGORY DATA
       -------------------------------------------------------- */

    const nameJa =
      optionalString(
        body.name_ja,
        255
      );

    if (!nameJa) {
      return NextResponse.json(
        {
          error:
            "日本語のカテゴリ名を入力してください。",
        },
        {
          status: 400,
        }
      );
    }

    const nameVi =
      optionalString(
        body.name_vi,
        255
      );

    const nameEn =
      optionalString(
        body.name_en,
        255
      );

    const nameZh =
      optionalString(
        body.name_zh,
        255
      );

    const imageUrl =
      optionalString(
        body.image_url,
        500
      );

    const isActive =
      typeof body.is_active ===
      "boolean"
        ? body.is_active
        : true;

    /* --------------------------------------------------------
       DISPLAY ORDER
       -------------------------------------------------------- */

    const maxOrderCategory =
      await db.tbl_menu_category.aggregate(
        {
          where: {
            menu_id: menuId,
          },

          _max: {
            display_order: true,
          },
        }
      );

    const nextDisplayOrder =
      (maxOrderCategory._max
        .display_order ?? 0) + 1;

    /* --------------------------------------------------------
       CREATE
       -------------------------------------------------------- */

    const category =
      await db.tbl_menu_category.create(
        {
          data: {
            menu_id: menuId,

            name_ja: nameJa,
            name_vi: nameVi,
            name_en: nameEn,
            name_zh: nameZh,

            image_url: imageUrl,

            display_order:
              nextDisplayOrder,

            is_active: isActive,
          },

          select: {
            id: true,
            menu_id: true,

            name_ja: true,
            name_vi: true,
            name_en: true,
            name_zh: true,

            image_url: true,

            display_order: true,
            is_active: true,

            created_at: true,
          },
        }
      );

    /* --------------------------------------------------------
       RESPONSE
       -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        category:
          serializeCategory(
            category
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[POST /api/store-manager/menu-categories]",
      error
    );

    return NextResponse.json(
      {
        error:
          "カテゴリの作成に失敗しました。",
      },
      {
        status: 500,
      }
    );
  }
}