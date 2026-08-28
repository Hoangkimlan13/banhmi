import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import { getStoreSession } from "@/lib/store-session";

// ============================================================
// TYPES
// ============================================================

type CreateMenuBody = {
  name?: unknown;
  is_default?: unknown;
};

type UpdateMenuBody = {
  id?: unknown;
  name?: unknown;
  is_default?: unknown;
  is_active?: unknown;
};

// ============================================================
// HELPERS
// ============================================================

function jsonError(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    {
      status,
    }
  );
}

function serializeMenu(
  menu: {
    id: number;
    store_id: number;
    name: string;
    is_default: boolean | null;
    is_active: boolean | null;
    _count: {
      tbl_menu_category: number;
      tbl_menu_item: number;
    };
  }
) {
  return {
    id: Number(menu.id),
    store_id: Number(menu.store_id),
    name: menu.name,
    is_default: Boolean(
      menu.is_default
    ),
    is_active: Boolean(
      menu.is_active
    ),

    categoryCount:
      menu._count.tbl_menu_category,

    itemCount:
      menu._count.tbl_menu_item,
  };
}

// ============================================================
// GET
// ============================================================

export async function GET() {
  try {
    // ----------------------------------------------------------
    // SESSION
    // ----------------------------------------------------------

    const session =
      await getStoreSession();

    if (!session?.storeId) {
      return jsonError(
        "店舗ログイン情報がありません。",
        401
      );
    }

    const storeId =
      Number(session.storeId);

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return jsonError(
        "店舗情報が不正です。",
        401
      );
    }

    // ----------------------------------------------------------
    // STORE CHECK
    // ----------------------------------------------------------

    const store =
      await db.tbl_store.findUnique({
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
      return jsonError(
        "店舗が見つかりません。",
        404
      );
    }

    // ----------------------------------------------------------
    // MENUS
    // ----------------------------------------------------------

    const menus =
      await db.tbl_menu.findMany({
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

    return NextResponse.json({
      success: true,

      store: {
        id: Number(store.id),
        title: store.title,
        type: String(store.type),
      },

      menus: menus.map(
        serializeMenu
      ),
    });
  } catch (error) {
    console.error(
      "[MenuSettings GET]",
      error
    );

    return jsonError(
      "メニュー情報の取得に失敗しました。",
      500
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
    // ----------------------------------------------------------
    // SESSION
    // ----------------------------------------------------------

    const session =
      await getStoreSession();

    if (!session?.storeId) {
      return jsonError(
        "店舗ログイン情報がありません。",
        401
      );
    }

    const storeId =
      Number(session.storeId);

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return jsonError(
        "店舗情報が不正です。",
        401
      );
    }

    // ----------------------------------------------------------
    // STORE
    // ----------------------------------------------------------

    const store =
      await db.tbl_store.findUnique({
        where: {
          id: storeId,
        },

        select: {
          id: true,
          type: true,
        },
      });

    if (!store) {
      return jsonError(
        "店舗が見つかりません。",
        404
      );
    }

    // ----------------------------------------------------------
    // BODY
    // ----------------------------------------------------------

    const body =
      (await request.json()) as CreateMenuBody;

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const isDefault =
      body.is_default === true;

    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!name) {
      return jsonError(
        "メニュー名を入力してください。"
      );
    }

    if (name.length > 100) {
      return jsonError(
        "メニュー名は100文字以内で入力してください。"
      );
    }

    // ----------------------------------------------------------
    // CHECK DUPLICATE
    // ----------------------------------------------------------

    const duplicate =
      await db.tbl_menu.findFirst({
        where: {
          store_id: storeId,
          name: name,
          is_active: true,
        },

        select: {
          id: true,
        },
      });

    if (duplicate) {
      return jsonError(
        "同じ名前のメニューが既に存在します。"
      );
    }

    // ----------------------------------------------------------
    // TRANSACTION
    //
    // is_default = true の場合、
    // 同じ store の他 menu を default false にする。
    // ----------------------------------------------------------

    const menu =
      await db.$transaction(
        async (tx) => {
          if (isDefault) {
            await tx.tbl_menu.updateMany({
              where: {
                store_id: storeId,
              },

              data: {
                is_default: false,
              },
            });
          }

          return tx.tbl_menu.create({
            data: {
              store_id: storeId,
              name,
              is_default: isDefault,
              is_active: true,
            },

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
        }
      );

    return NextResponse.json(
      {
        success: true,
        menu: serializeMenu(menu),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "[MenuSettings POST]",
      error
    );

    return jsonError(
      "メニューの作成に失敗しました。",
      500
    );
  }
}

// ============================================================
// PATCH
// ============================================================

export async function PATCH(
  request: Request
) {
  try {
    // ----------------------------------------------------------
    // SESSION
    // ----------------------------------------------------------

    const session =
      await getStoreSession();

    if (!session?.storeId) {
      return jsonError(
        "店舗ログイン情報がありません。",
        401
      );
    }

    const storeId =
      Number(session.storeId);

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return jsonError(
        "店舗情報が不正です。",
        401
      );
    }

    // ----------------------------------------------------------
    // BODY
    // ----------------------------------------------------------

    const body =
      (await request.json()) as UpdateMenuBody;

    const id =
      typeof body.id === "number"
        ? body.id
        : Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return jsonError(
        "メニューIDが不正です。"
      );
    }

    // ----------------------------------------------------------
    // IMPORTANT
    //
    // menu phải thuộc store đang login
    // ----------------------------------------------------------

    const existing =
      await db.tbl_menu.findFirst({
        where: {
          id,
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

    if (!existing) {
      return jsonError(
        "メニューが見つかりません。",
        404
      );
    }

    // ----------------------------------------------------------
    // REACTIVATE ONLY
    // ----------------------------------------------------------

    if (
      body.is_active === true &&
      typeof body.name !== "string"
    ) {
      const menu =
        await db.tbl_menu.update({
          where: {
            id: existing.id,
          },

          data: {
            is_active: true,
          },

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

      return NextResponse.json({
        success: true,
        menu: serializeMenu(menu),
      });
    }

    // ----------------------------------------------------------
    // NAME
    // ----------------------------------------------------------

    let name = existing.name;

    if (
      typeof body.name === "string"
    ) {
      name = body.name.trim();

      if (!name) {
        return jsonError(
          "メニュー名を入力してください。"
        );
      }

      if (name.length > 100) {
        return jsonError(
          "メニュー名は100文字以内で入力してください。"
        );
      }

      const duplicate =
        await db.tbl_menu.findFirst({
          where: {
            store_id: storeId,
            name,
            id: {
              not: id,
            },
            is_active: true,
          },

          select: {
            id: true,
          },
        });

      if (duplicate) {
        return jsonError(
          "同じ名前のメニューが既に存在します。"
        );
      }
    }

    // ----------------------------------------------------------
    // DEFAULT
    // ----------------------------------------------------------

    const isDefault =
      typeof body.is_default === "boolean"
        ? body.is_default
        : Boolean(
            existing.is_default
          );

    // ----------------------------------------------------------
    // UPDATE
    // ----------------------------------------------------------

    const menu =
      await db.$transaction(
        async (tx) => {
          if (isDefault) {
            await tx.tbl_menu.updateMany({
              where: {
                store_id: storeId,
                id: {
                  not: id,
                },
              },

              data: {
                is_default: false,
              },
            });
          }

          return tx.tbl_menu.update({
            where: {
              id,
            },

            data: {
              name,
              is_default: isDefault,

              ...(typeof body.is_active ===
                "boolean"
                ? {
                    is_active:
                      body.is_active,
                  }
                : {}),
            },

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
        }
      );

    return NextResponse.json({
      success: true,
      menu: serializeMenu(menu),
    });
  } catch (error) {
    console.error(
      "[MenuSettings PATCH]",
      error
    );

    return jsonError(
      "メニューの更新に失敗しました。",
      500
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
    // ----------------------------------------------------------
    // SESSION
    // ----------------------------------------------------------

    const session =
      await getStoreSession();

    if (!session?.storeId) {
      return jsonError(
        "店舗ログイン情報がありません。",
        401
      );
    }

    const storeId =
      Number(session.storeId);

    if (
      !Number.isInteger(storeId) ||
      storeId <= 0
    ) {
      return jsonError(
        "店舗情報が不正です。",
        401
      );
    }

    // ----------------------------------------------------------
    // BODY
    // ----------------------------------------------------------

    const body =
      await request.json();

    const id =
      typeof body.id === "number"
        ? body.id
        : Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return jsonError(
        "メニューIDが不正です。"
      );
    }

    // ----------------------------------------------------------
    // OWNERSHIP CHECK
    // ----------------------------------------------------------

    const menu =
      await db.tbl_menu.findFirst({
        where: {
          id,
          store_id: storeId,
        },

        select: {
          id: true,
          is_default: true,
          is_active: true,
        },
      });

    if (!menu) {
      return jsonError(
        "メニューが見つかりません。",
        404
      );
    }

    if (!menu.is_active) {
      return NextResponse.json({
        success: true,
        message:
          "メニューは既に無効です。",
      });
    }

    // ----------------------------------------------------------
    // DEFAULT MENU
    //
    // Không cho disable menu default
    // nếu store không còn menu active khác.
    // ----------------------------------------------------------

    if (menu.is_default) {
      const activeMenuCount =
        await db.tbl_menu.count({
          where: {
            store_id: storeId,
            is_active: true,
          },
        });

      if (activeMenuCount <= 1) {
        return jsonError(
          "最後のメニューは無効にできません。"
        );
      }
    }

    // ----------------------------------------------------------
    // SOFT DELETE
    // ----------------------------------------------------------

    await db.tbl_menu.update({
      where: {
        id: menu.id,
      },

      data: {
        is_active: false,

        // Nếu menu default bị disable,
        // bỏ default.
        is_default: false,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "メニューを無効にしました。",
    });
  } catch (error) {
    console.error(
      "[MenuSettings DELETE]",
      error
    );

    return jsonError(
      "メニューの無効化に失敗しました。",
      500
    );
  }
}