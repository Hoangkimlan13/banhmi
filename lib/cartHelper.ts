// ============================================================
// CART KEY TYPES
// ============================================================

export interface CartKeyOptions {
  /**
   * ID của variant.
   *
   * Ví dụ:
   *
   * Regular = 1
   * Mini    = 2
   *
   * null = món không có variant.
   */
  variantId?: number | string | null;

  /**
   * Các option đã chọn.
   */
  selectedOptions?: Record<string, any>;

  /**
   * Tương thích với code cũ.
   */
  [key: string]: any;
}

// ============================================================
// STABLE SERIALIZE
// ============================================================

function stableStringify(
  value: any
): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item) =>
        stableStringify(item)
      )
      .join(",")}]`;
  }

  const keys =
    Object.keys(value).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(
          key
        )}:${stableStringify(
          value[key]
        )}`
    )
    .join(",")}}`;
}

// ============================================================
// NORMALIZE SELECTED OPTIONS
// ============================================================

function normalizeSelectedOptions(
  selectedOptions:
    | Record<string, any>
    | undefined
): Record<string, any> {
  if (
    !selectedOptions ||
    typeof selectedOptions !==
      "object"
  ) {
    return {};
  }

  const normalized:
    Record<string, any> = {};

  Object.keys(selectedOptions)
    .sort()
    .forEach((groupKey) => {
      const selected =
        selectedOptions[groupKey];

      // ======================================================
      // MULTIPLE
      // ======================================================

      if (Array.isArray(selected)) {
        normalized[groupKey] = [
          ...selected,
        ]
          .map((option: any) => {
            if (
              !option ||
              typeof option !==
                "object"
            ) {
              return option;
            }

            return {
              id:
                option.id ??
                null,

              code:
                option.code ??
                null,

              /**
               * Variant context nếu có.
               *
               * Không lưu price vào cart key.
               * Giá có thể thay đổi theo DB,
               * nhưng lựa chọn của khách không đổi.
               */
              variantId:
                option.variantId ??
                null,
            };
          })
          .sort(
            (
              a: any,
              b: any
            ) => {
              const aId =
                String(
                  a?.id ?? ""
                );

              const bId =
                String(
                  b?.id ?? ""
                );

              return aId.localeCompare(
                bId
              );
            }
          );

        return;
      }

      // ======================================================
      // SINGLE
      // ======================================================

      if (
        selected &&
        typeof selected ===
          "object"
      ) {
        normalized[groupKey] = {
          id:
            selected.id ??
            null,

          code:
            selected.code ??
            null,

          variantId:
            selected.variantId ??
            null,
        };

        return;
      }

      normalized[groupKey] =
        selected;
    });

  return normalized;
}

// ============================================================
// GENERATE CART KEY
// ============================================================

export function generateCartKey(
  productId:
    | number
    | string,

  options:
    CartKeyOptions = {},

  note: string = ""
): string {
  // ==========================================================
  // PRODUCT
  // ==========================================================

  const normalizedProductId =
    String(productId);

  // ==========================================================
  // VARIANT
  // ==========================================================

  const variantId =
    options?.variantId !==
      undefined &&
    options?.variantId !==
      null
      ? String(
          options.variantId
        )
      : "none";

  // ==========================================================
  // OPTIONS
  // ==========================================================

  const selectedOptions =
    normalizeSelectedOptions(
      options?.selectedOptions
    );

  // ==========================================================
  // NOTE
  // ==========================================================

  const normalizedNote =
    String(
      note ?? ""
    ).trim();

  // ==========================================================
  // KEY DATA
  // ==========================================================

  const keyData = {
    productId:
      normalizedProductId,

    variantId,

    selectedOptions,

    note:
      normalizedNote,
  };

  // ==========================================================
  // STABLE KEY
  // ==========================================================

  return stableStringify(
    keyData
  );
}

// ============================================================
// CART STORAGE
// ============================================================

const CART_STORAGE_KEY =
  "user_shopping_cart";

const CART_EXPIRY_DAYS =
  7;

// ============================================================
// GET INITIAL CART
// ============================================================

export const getInitialCart =
  (): any[] => {
    // Chỉ chạy Client.
    if (
      typeof window ===
      "undefined"
    ) {
      return [];
    }

    try {
      const savedData =
        localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!savedData) {
        return [];
      }

      const parsed =
        JSON.parse(
          savedData
        );

      const cart =
        Array.isArray(
          parsed?.cart
        )
          ? parsed.cart
          : [];

      const timestamp =
        Number(
          parsed?.timestamp ??
            0
        );

      // Nếu timestamp không hợp lệ,
      // vẫn giữ cart.
      if (
        !Number.isFinite(
          timestamp
        ) ||
        timestamp <= 0
      ) {
        return cart;
      }

      const now =
        Date.now();

      const expiryTime =
        CART_EXPIRY_DAYS *
        24 *
        60 *
        60 *
        1000;

      if (
        now - timestamp >
        expiryTime
      ) {
        localStorage.removeItem(
          CART_STORAGE_KEY
        );

        return [];
      }

      return cart;
    } catch (error) {
      console.error(
        "[Cart] Failed to read cart from localStorage:",
        error
      );

      return [];
    }
  };

// ============================================================
// SAVE CART
// ============================================================

export const saveCartToStorage =
  (
    cart: any[]
  ): void => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      const safeCart =
        Array.isArray(cart)
          ? cart
          : [];

      const dataToSave = {
        cart:
          safeCart,

        timestamp:
          Date.now(),
      };

      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(
          dataToSave
        )
      );
    } catch (error) {
      console.error(
        "[Cart] Failed to save cart to localStorage:",
        error
      );
    }
  };

// ============================================================
// CLEAR CART
// ============================================================

export const clearCartStorage =
  (): void => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      localStorage.removeItem(
        CART_STORAGE_KEY
      );
    } catch (error) {
      console.error(
        "[Cart] Failed to clear cart:",
        error
      );
    }
  };
