"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Save,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";

import styles from "../styles/menuItemOptionVariantPrices.module.css";

type Variant = {
  id: number;
  name_ja: string;
  code?: string | null;
};

type OptionItem = {
  id: number;
  option_group_id: number;
  name_ja: string;
  price: number | string;
  is_available: boolean;
};

type PriceRow = {
  option_item_id: number;
  variant_id: number;
  price: number;
};

type Props = {
  menuId: number | null;
  itemId: number | null;

  selectedItems: number[];

  optionItems: OptionItem[];

  variants: Variant[];
};

export default function MenuItemOptionVariantPrices({
  menuId,
  itemId,
  selectedItems,
  optionItems,
  variants,
}: Props) {
  const [prices, setPrices] =
    useState<Record<string, number>>({});

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Chỉ hiển thị option item
   * đang được chọn.
   */
  const selectedOptionItems =
    useMemo(() => {
      const selected =
        new Set(selectedItems);

      return optionItems.filter(
        (item) =>
          selected.has(item.id) &&
          item.is_available
      );
    }, [
      optionItems,
      selectedItems,
    ]);

  /*
   * Load giá.
   */
  useEffect(() => {
    if (!itemId) {
      setPrices({});
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setSaved(false);

      try {
        const response =
          await fetch(
            `/api/store-manager/menu-item-option-variant-prices?menu_item_id=${itemId}`,
            {
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "価格を取得できません。"
          );
        }

        if (cancelled) {
          return;
        }

        const nextPrices:
          Record<string, number> = {};

        for (
          const row of
            data.prices ?? []
        ) {
          const key =
            `${row.option_item_id}_${row.variant_id}`;

          nextPrices[key] =
            Number(row.price);
        }

        setPrices(nextPrices);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "価格を取得できません。"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  function getKey(
    optionItemId: number,
    variantId: number
  ) {
    return `${optionItemId}_${variantId}`;
  }

  function getPrice(
    optionItemId: number,
    variantId: number
  ) {
    const key = getKey(
      optionItemId,
      variantId
    );

    return prices[key] ?? 0;
  }

  function changePrice(
    optionItemId: number,
    variantId: number,
    value: string
  ) {
    const numberValue =
      value === ""
        ? 0
        : Number(value);

    if (
      !Number.isFinite(
        numberValue
      ) ||
      numberValue < 0
    ) {
      return;
    }

    const key = getKey(
      optionItemId,
      variantId
    );

    setSaved(false);
    setError("");

    setPrices(
      (current) => ({
        ...current,
        [key]: numberValue,
      })
    );
  }

  async function handleSave() {
    if (!itemId) {
      setError(
        "商品を先に保存してください。"
      );
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const selectedSet =
        new Set(
          selectedItems
        );

      const rows: PriceRow[] = [];

      for (
        const optionItem of
          optionItems
      ) {
        if (
          !selectedSet.has(
            optionItem.id
          )
        ) {
          continue;
        }

        if (
          !optionItem.is_available
        ) {
          continue;
        }

        for (
          const variant of
            variants
        ) {
          rows.push({
            option_item_id:
              optionItem.id,

            variant_id:
              variant.id,

            price:
              getPrice(
                optionItem.id,
                variant.id
              ),
          });
        }
      }

      const response =
        await fetch(
          "/api/store-manager/menu-item-option-variant-prices",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body: JSON.stringify({
              menu_item_id:
                itemId,

              prices: rows,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "価格を保存できません。"
        );
      }

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "価格を保存できません。"
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * Chưa có item
   */
  if (!itemId) {
    return null;
  }

  /*
   * Không có variant
   */
  if (
    !loading &&
    variants.length === 0
  ) {
    return null;
  }

  /*
   * Không có option item
   */
  if (
    !loading &&
    selectedOptionItems.length === 0
  ) {
    return null;
  }

  return (
    <section
      className={
        styles.container
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <h3>
            サイズ別オプション価格
          </h3>

          <p>
            サイズごとにオプション価格を設定します。
          </p>
        </div>

        <button
          type="button"
          onClick={
            handleSave
          }
          disabled={
            loading ||
            saving
          }
          className={
            styles.saveButton
          }
        >
          {saving ? (
            <>
              <Loader2
                size={16}
                className={
                  styles.spin
                }
              />

              保存中...
            </>
          ) : (
            <>
              <Save
                size={16}
              />

              保存する
            </>
          )}
        </button>
      </div>

      {loading && (
        <div
          className={
            styles.message
          }
        >
          <Loader2
            size={17}
            className={
              styles.spin
            }
          />

          価格情報を読み込み中...
        </div>
      )}

      {error && (
        <div
          className={
            styles.error
          }
        >
          <AlertCircle
            size={17}
          />

          {error}
        </div>
      )}

      {saved && !error && (
        <div
          className={
            styles.success
          }
        >
          <Check
            size={17}
          />

          サイズ別価格を保存しました。
        </div>
      )}

      {!loading && (
        <div
          className={
            styles.tableWrapper
          }
        >
          <table
            className={
              styles.table
            }
          >
            <thead>
              <tr>
                <th>
                  オプション
                </th>

                {variants.map(
                  (variant) => (
                    <th
                      key={
                        variant.id
                      }
                    >
                      {variant.name_ja}

                      {variant.code && (
                        <span>
                          {variant.code}
                        </span>
                      )}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {selectedOptionItems.map(
                (optionItem) => (
                  <tr
                    key={
                      optionItem.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          optionItem.name_ja
                        }
                      </strong>

                      <small>
                        基本 +¥
                        {Number(
                          optionItem.price
                        ).toLocaleString(
                          "ja-JP"
                        )}
                      </small>
                    </td>

                    {variants.map(
                      (variant) => (
                        <td
                          key={
                            variant.id
                          }
                        >
                          <div
                            className={
                              styles.priceInput
                            }
                          >
                            <span>
                              ¥
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={getPrice(
                                optionItem.id,
                                variant.id
                              )}
                              onChange={(e) =>
                                changePrice(
                                  optionItem.id,
                                  variant.id,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </td>
                      )
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}