import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

interface CartItemInput {
  menuItemId: number;
  variantId?: number | null;
  quantity: number;
  selectedOptions?: Record<string, unknown>;
}

const UNAVAILABLE_VARIANT_STATUSES = [
  "sold_out",
  "unavailable",
  "out_of_stock",
  "paused",
  "inactive",
] as const;

type UnavailableVariantStatus =
  (typeof UNAVAILABLE_VARIANT_STATUSES)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ============================================================
    // 1. RESOLVE STORE IDENTIFIER
    // ============================================================

    const rawStoreId = body?.storeId;
    const rawStoreSlug = body?.storeSlug;

    /**
     * storeId:
     * - number
     * - numeric string
     * - null
     */
    let storeId: number | null = null;

    if (
      rawStoreId !== undefined &&
      rawStoreId !== null &&
      rawStoreId !== ""
    ) {
      const parsedStoreId = Number(rawStoreId);

      if (
        Number.isInteger(parsedStoreId) &&
        parsedStoreId > 0
      ) {
        storeId = parsedStoreId;
      }
    }

    /**
     * storeSlug:
     * - string có giá trị
     * - null
     */
    const storeSlug =
      typeof rawStoreSlug === "string" &&
      rawStoreSlug.trim().length > 0
        ? rawStoreSlug.trim()
        : null;

    /**
     * Không có cả storeId và storeSlug
     */
    if (storeId === null && storeSlug === null) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          code: "MISSING_STORE_IDENTIFIER",
          message: "Missing store identifier",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 2. CART ITEMS
    // ============================================================

    const items: CartItemInput[] = Array.isArray(body?.items)
      ? body.items
      : [];

    /**
     * Cart rỗng:
     * Không cần validate món.
     */
    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        valid: true,
        store: null,
        menuId: null,
        items: [],
      });
    }

    // ============================================================
    // 3. RESOLVE STORE
    // ============================================================

    let store;

    if (storeSlug !== null) {
      /**
       * Nếu có slug thì ưu tiên slug.
       */
      store = await db.tbl_store.findFirst({
        where: {
          slug: storeSlug,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
        },
      });
    } else {
      /**
       * Tới đây storeSlug === null.
       *
       * Phải guard storeId để TypeScript biết chắc
       * storeId không còn là null.
       */
      if (storeId === null) {
        return NextResponse.json(
          {
            success: false,
            valid: false,
            code: "INVALID_STORE_ID",
            message: "Invalid store id",
          },
          { status: 400 }
        );
      }

      store = await db.tbl_store.findFirst({
        where: {
          id: storeId,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
        },
      });
    }

    // ============================================================
    // 4. STORE NOT FOUND
    // ============================================================

    if (!store) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          code: "STORE_NOT_FOUND",
          message: "Store not found",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 5. GET ACTIVE MENU OF CURRENT STORE
    // ============================================================

    /**
     * Một store có thể có nhiều menu.
     *
     * Ưu tiên:
     * 1. menu mặc định
     * 2. menu có id nhỏ hơn
     */
    const menu = await db.tbl_menu.findFirst({
      where: {
        store_id: store.id,
        is_active: true,
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
      },
    });

    /**
     * Store không có menu active.
     */
    if (!menu) {
      return NextResponse.json({
        success: true,
        valid: false,
        code: "STORE_NO_MENU",
        message: "This store has no active menu",

        store: {
          id: store.id,
          slug: store.slug,
          title: store.title,
          type: store.type,
        },

        menuId: null,
        items: [],
      });
    }

    // ============================================================
    // 6. NORMALIZE CART ITEMS
    // ============================================================

    const normalizedItems = items.map((item) => {
      /**
       * menuItemId luôn convert về number.
       */
      const menuItemId = Number(item?.menuItemId);

      /**
       * QUAN TRỌNG:
       *
       * variantId đã được khai báo:
       *
       * number | null | undefined
       *
       * nên KHÔNG được so sánh với "".
       *
       * Chỉ cần:
       * - undefined
       * - null
       *
       * thì coi như không có variant.
       */
      const variantId =
        item?.variantId !== undefined &&
        item?.variantId !== null
          ? Number(item.variantId)
          : null;

      /**
       * quantity luôn convert về number.
       */
      const quantity = Number(item?.quantity);

      return {
        ...item,
        menuItemId,
        variantId,
        quantity,
      };
    });

    // ============================================================
    // 7. COLLECT MENU ITEM IDS
    // ============================================================

    const menuItemIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.menuItemId)
          .filter(
            (id): id is number =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];

    // ============================================================
    // 8. COLLECT VARIANT IDS
    // ============================================================

    const variantIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.variantId)
          .filter(
            (id): id is number =>
              id !== null &&
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];

    // ============================================================
    // 9. GET MENU ITEMS BELONGING TO CURRENT STORE MENU
    // ============================================================

    /**
     * Đây là phần QUAN TRỌNG NHẤT.
     *
     * Ví dụ:
     *
     * STORE A
     *   menu_id = 10
     *   menu_item_id = 100
     *
     * localStorage:
     *   menuItemId = 100
     *
     * Sau đó khách chuyển sang:
     *
     * STORE B
     *   menu_id = 20
     *
     * Nếu menu_id = 20 không có item 100
     * thì query này KHÔNG trả về item 100.
     *
     * => ITEM_NOT_AVAILABLE_AT_STORE
     */

    const menuItems =
      menuItemIds.length > 0
        ? await db.tbl_menu_item.findMany({
            where: {
              menu_id: menu.id,

              id: {
                in: menuItemIds,
              },
            },

            select: {
              id: true,
              menu_id: true,
              status: true,

              name_vi: true,
              name_ja: true,
              name_en: true,
              name_zh: true,
            },
          })
        : [];

    const menuItemMap = new Map(
      menuItems.map((item) => [
        item.id,
        item,
      ])
    );

    // ============================================================
    // 10. GET ALL MENU ITEMS
    // ============================================================

    /**
     * Query này KHÔNG dùng để xác định item có thuộc store hay không.
     *
     * Nó chỉ dùng để lấy tên món.
     *
     * Ví dụ:
     *
     * Store A có:
     *   menu_item_id = 100
     *
     * Store B không có:
     *   menu_item_id = 100
     *
     * Vẫn lấy được tên "Bánh mì X"
     * để frontend hiển thị thông báo rõ ràng.
     */

    const allMenuItems =
      menuItemIds.length > 0
        ? await db.tbl_menu_item.findMany({
            where: {
              id: {
                in: menuItemIds,
              },
            },

            select: {
              id: true,
              status: true,

              name_vi: true,
              name_ja: true,
              name_en: true,
              name_zh: true,
            },
          })
        : [];

    const allMenuItemMap = new Map(
      allMenuItems.map((item) => [
        item.id,
        item,
      ])
    );

    // ============================================================
    // 11. GET VARIANTS
    // ============================================================

    const variants =
      variantIds.length > 0
        ? await db.tbl_menu_item_variants.findMany({
            where: {
              id: {
                in: variantIds,
              },

              deleted_at: null,
            },

            select: {
              id: true,
              menu_item_id: true,

              is_available: true,
              stock_status: true,

              name_vi: true,
              name_ja: true,
              name_en: true,
              name_zh: true,
            },
          })
        : [];

    const variantMap = new Map(
      variants.map((variant) => [
        variant.id,
        variant,
      ])
    );

    // ============================================================
    // 12. VALIDATE EACH CART ITEM
    // ============================================================

    const results = normalizedItems.map((item) => {
      const {
        menuItemId,
        variantId,
        quantity,
      } = item;

      // ----------------------------------------------------------
      // 12.1 INVALID MENU ITEM ID
      // ----------------------------------------------------------

      if (
        !Number.isInteger(menuItemId) ||
        menuItemId <= 0
      ) {
        return {
          menuItemId,
          variantId,
          quantity,

          valid: false,

          reason: "INVALID_MENU_ITEM_ID",
        };
      }

      // ----------------------------------------------------------
      // 12.2 INVALID QUANTITY
      // ----------------------------------------------------------

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return {
          menuItemId,
          variantId,
          quantity,

          valid: false,

          reason: "INVALID_QUANTITY",
        };
      }

      // ----------------------------------------------------------
      // 12.3 ITEM MUST BELONG TO CURRENT STORE MENU
      // ----------------------------------------------------------

      const menuItem =
        menuItemMap.get(menuItemId);

      if (!menuItem) {
        /**
         * Item có thể tồn tại ở Store A
         * nhưng không tồn tại trong Store B.
         */

        const originalItem =
          allMenuItemMap.get(menuItemId);

        return {
          menuItemId,
          variantId,
          quantity,

          valid: false,

          reason:
            "ITEM_NOT_AVAILABLE_AT_STORE",

          name_vi:
            originalItem?.name_vi ?? "",

          name_ja:
            originalItem?.name_ja ?? "",

          name_en:
            originalItem?.name_en ?? "",

          name_zh:
            originalItem?.name_zh ?? "",
        };
      }

      // ----------------------------------------------------------
      // 12.4 ITEM STATUS
      // ----------------------------------------------------------

      if (menuItem.status !== "ACTIVE") {
        return {
          menuItemId,
          variantId,
          quantity,

          valid: false,

          reason: "ITEM_UNAVAILABLE",

          status: menuItem.status,

          name_vi: menuItem.name_vi,
          name_ja: menuItem.name_ja,
          name_en: menuItem.name_en,
          name_zh: menuItem.name_zh,
        };
      }

      // ----------------------------------------------------------
      // 12.5 VALIDATE VARIANT
      // ----------------------------------------------------------

      if (variantId !== null) {
        const variant =
          variantMap.get(variantId);

        // --------------------------------------------------------
        // Variant không tồn tại
        // --------------------------------------------------------

        if (!variant) {
          return {
            menuItemId,
            variantId,
            quantity,

            valid: false,

            reason: "VARIANT_NOT_FOUND",
          };
        }

        // --------------------------------------------------------
        // Variant thuộc món khác
        // --------------------------------------------------------

        if (
          variant.menu_item_id !==
          menuItemId
        ) {
          return {
            menuItemId,
            variantId,
            quantity,

            valid: false,

            reason: "INVALID_VARIANT",
          };
        }

        // --------------------------------------------------------
        // CHECK VARIANT AVAILABILITY
        // --------------------------------------------------------

        const stockStatus =
          String(
            variant.stock_status ??
              "available"
          ).toLowerCase();

        const variantUnavailable =
          variant.is_available !== true ||
          UNAVAILABLE_VARIANT_STATUSES.includes(
            stockStatus as UnavailableVariantStatus
          );

        if (variantUnavailable) {
          return {
            menuItemId,
            variantId,
            quantity,

            valid: false,

            reason:
              "VARIANT_UNAVAILABLE",

            variantStatus:
              variant.stock_status,

            variantName_vi:
              variant.name_vi,

            variantName_ja:
              variant.name_ja,

            variantName_en:
              variant.name_en,

            variantName_zh:
              variant.name_zh,
          };
        }
      }

      // ----------------------------------------------------------
      // 12.6 VALID
      // ----------------------------------------------------------

      return {
        menuItemId,
        variantId,
        quantity,

        valid: true,
      };
    });

    // ============================================================
    // 13. FINAL RESULT
    // ============================================================

    const valid = results.every(
      (item) => item.valid
    );

    return NextResponse.json({
      success: true,

      valid,

      store: {
        id: store.id,
        slug: store.slug,
        title: store.title,
        type: store.type,
      },

      menuId: menu.id,

      items: results,
    });
  } catch (error) {
    console.error(
      "[POST /api/cart/validate] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        valid: false,

        code: "VALIDATION_ERROR",

        message:
          "Unable to validate cart",
      },
      {
        status: 500,
      }
    );
  }
}

