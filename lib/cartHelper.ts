// ============================================================
// CART KEY TYPES
// ============================================================

export interface CartKeyOptions {
  /**
   * Variant của món.
   *
   * Ví dụ:
   * S = 1
   * M = 2
   * L = 3
   *
   * null = món không có variant.
   */
  variantId?: number | string | null;

  /**
   * Các option đã chọn.
   *
   * Ví dụ:
   *
   * {
   *   "group-1": {
   *     id: 10,
   *     name_vi: "Thêm ngò"
   *   }
   * }
   *
   * hoặc multiple:
   *
   * {
   *   "group-2": [
   *     { id: 20 },
   *     { id: 21 }
   *   ]
   * }
   */
  selectedOptions?: Record<string, any>;

  /**
   * Cho phép tương thích với code cũ
   * nếu nơi khác vẫn truyền object trực tiếp.
   */
  [key: string]: any;
}

// ============================================================
// STABLE SERIALIZE
// ============================================================

/**
 * Serialize object ổn định.
 *
 * Mục đích:
 * { a: 1, b: 2 }
 * và
 * { b: 2, a: 1 }
 *
 * phải tạo cùng một cart key.
 */
function stableStringify(value: any): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item) =>
        stableStringify(item)
      )
      .join(",")}]`;
  }

  const keys = Object.keys(value).sort();

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
  selectedOptions: Record<string, any> | undefined
) {
  if (
    !selectedOptions ||
    typeof selectedOptions !== "object"
  ) {
    return {};
  }

  const normalized: Record<string, any> = {};

  Object.keys(selectedOptions)
    .sort()
    .forEach((groupKey) => {
      const selected =
        selectedOptions[groupKey];

      // --------------------------------------------------------
      // MULTIPLE
      // --------------------------------------------------------

      if (Array.isArray(selected)) {
        normalized[groupKey] =
          [...selected]
            .map((option: any) => {
              if (
                !option ||
                typeof option !== "object"
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

                variantId:
                  option.variantId ??
                  null,
              };
            })
            .sort((a: any, b: any) => {
              return String(
                a?.id ?? ""
              ).localeCompare(
                String(
                  b?.id ?? ""
                )
              );
            });

        return;
      }

      // --------------------------------------------------------
      // SINGLE
      // --------------------------------------------------------

      if (
        selected &&
        typeof selected === "object"
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
  productId: number | string,
  options: CartKeyOptions = {},
  note: string = ""
): string {
  // ----------------------------------------------------------
  // PRODUCT
  // ----------------------------------------------------------

  const normalizedProductId =
    String(productId);

  // ----------------------------------------------------------
  // VARIANT
  // ----------------------------------------------------------

  const variantId =
    options?.variantId !==
      undefined &&
    options?.variantId !== null
      ? String(options.variantId)
      : "none";

  // ----------------------------------------------------------
  // OPTIONS
  // ----------------------------------------------------------

  const selectedOptions =
    normalizeSelectedOptions(
      options?.selectedOptions
    );

  // ----------------------------------------------------------
  // NOTE
  // ----------------------------------------------------------

  const normalizedNote =
    String(note ?? "").trim();

  // ----------------------------------------------------------
  // KEY DATA
  // ----------------------------------------------------------

  const keyData = {
    productId:
      normalizedProductId,

    variantId,

    selectedOptions,

    note: normalizedNote,
  };

  // ----------------------------------------------------------
  // STABLE KEY
  // ----------------------------------------------------------

  return stableStringify(
    keyData
  );
}