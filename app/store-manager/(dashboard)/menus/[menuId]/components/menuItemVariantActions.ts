import type { MenuItemVariant } from "../MenuEditorClient";

/* ============================================================
   API RESPONSE
   ============================================================ */

type ApiResponse<T = unknown> = {
  success?: boolean;
  variant?: T;
  variants?: T[];
  error?: string;
};

/* ============================================================
   NORMALIZE
   ============================================================ */

function normalizeVariant(
  variant: any
): MenuItemVariant {
  return {
    ...variant,

    id: Number(variant.id),
    menu_item_id: Number(variant.menu_item_id),

    price: Number(variant.price),

    sort_order: Number(
      variant.sort_order ?? 0
    ),

    is_default: Boolean(
      variant.is_default
    ),

    is_available: Boolean(
      variant.is_available
    ),

    sku:
      variant.sku ??
      null,

    name_vi:
      variant.name_vi ??
      null,

    name_en:
      variant.name_en ??
      null,

    name_zh:
      variant.name_zh ??
      null,

    deleted_at:
      variant.deleted_at ??
      null,
  };
}

/* ============================================================
   GET VARIANTS
   ============================================================ */

export async function getMenuItemVariants(
  menuItemId: number
): Promise<MenuItemVariant[]> {
  const response = await fetch(
    `/api/store-manager/menu-item-variants?menuItemId=${menuItemId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data: ApiResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "サイズ情報を取得できません。"
    );
  }

  if (
    !data.success ||
    !Array.isArray(data.variants)
  ) {
    return [];
  }

  return data.variants.map(
    normalizeVariant
  );
}

/* ============================================================
   CREATE
   ============================================================ */

export type CreateVariantInput = {
  menu_item_id: number;

  code: string;

  sku?: string | null;

  name_ja: string;
  name_vi?: string | null;
  name_en?: string | null;
  name_zh?: string | null;

  price: number;

  is_default: boolean;
};

/* ============================================================
   CREATE VARIANT
   ============================================================ */

export async function createMenuItemVariant(
  input: CreateVariantInput
): Promise<MenuItemVariant> {
  const response = await fetch(
    "/api/store-manager/menu-item-variants",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(input),
    }
  );

  const data: ApiResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "サイズを追加できません。"
    );
  }

  if (
    !data.success ||
    !data.variant
  ) {
    throw new Error(
      "サイズの追加に失敗しました。"
    );
  }

  return normalizeVariant(
    data.variant
  );
}

/* ============================================================
   UPDATE
   ============================================================ */

export type UpdateVariantInput = {
  id: number;

  code: string;

  sku?: string | null;

  name_ja: string;
  name_vi?: string | null;
  name_en?: string | null;
  name_zh?: string | null;

  price: number;

  is_default: boolean;
};

/* ============================================================
   UPDATE VARIANT
   ============================================================ */

export async function updateMenuItemVariant(
  input: UpdateVariantInput
): Promise<MenuItemVariant> {
  const response = await fetch(
    "/api/store-manager/menu-item-variants",
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(input),
    }
  );

  const data: ApiResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "サイズを更新できません。"
    );
  }

  if (
    !data.success ||
    !data.variant
  ) {
    throw new Error(
      "サイズの更新に失敗しました。"
    );
  }

  return normalizeVariant(
    data.variant
  );
}

/* ============================================================
   DELETE / SOFT DELETE
   ============================================================ */

export async function deleteMenuItemVariant(
  id: number
): Promise<void> {
  const response = await fetch(
    "/api/store-manager/menu-item-variants",
    {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        id,
      }),
    }
  );

  const data: ApiResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "サイズを削除できません。"
    );
  }

  if (!data.success) {
    throw new Error(
      "サイズの削除に失敗しました。"
    );
  }
}

/* ============================================================
   TOGGLE AVAILABILITY
   ============================================================ */

export async function toggleMenuItemVariant(
  id: number,
  is_available: boolean
): Promise<MenuItemVariant> {
  const response = await fetch(
    "/api/store-manager/menu-item-variants",
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        id,
        is_available,
      }),
    }
  );

  const data: ApiResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ??
        "サイズの状態を変更できません。"
    );
  }

  if (
    !data.success ||
    !data.variant
  ) {
    throw new Error(
      "サイズの状態変更に失敗しました。"
    );
  }

  return normalizeVariant(
    data.variant
  );
}