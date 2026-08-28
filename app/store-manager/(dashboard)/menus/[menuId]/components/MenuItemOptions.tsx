"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  SlidersHorizontal,
  Check,
  AlertCircle,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import styles from "../styles/menuItemOptions.module.css";

import type {
  ItemOptionGroup,
  ItemOptionItem,
  MenuOptionGroup,
  OptionGroup,
  OptionItem,
} from "../MenuEditorClient";

/* ============================================================
   TYPES
   ============================================================ */

type Props = {
  menuId: number | null;
  itemId: number | null;

  itemOptionGroups: ItemOptionGroup[];
  itemOptionItems: ItemOptionItem[];

  optionGroups: OptionGroup[];
  optionItems: OptionItem[];

  menuOptionGroups: MenuOptionGroup[];
};

type Variant = {
  id: number;
  code: string;
  sku?: string | null;

  name_ja: string;
  name_vi?: string | null;
  name_en?: string | null;
  name_zh?: string | null;

  price: number;
  is_default: boolean;
  is_available: boolean;
  stock_status?: string;
};

type VariantPrice = {
  option_item_id: number;
  variant_id: number;
  price: number;
};

type OptionsResponse = {
  success?: boolean;

  menu_item_id?: number;

  option_group_ids?: number[];
  option_item_ids?: number[];

  variants?: Variant[];

  variant_prices?: VariantPrice[];

  error?: string;
  message?: string;
};

/* ============================================================
   HELPERS
   ============================================================ */

function uniquePositiveIds(values: unknown): number[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => Number(value))
        .filter(
          (value) =>
            Number.isInteger(value) &&
            value > 0
        )
    )
  );
}

function normalizePrice(value: unknown): number {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return 0;
  }

  return number;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function MenuItemOptions({
  menuId,
  itemId,

  itemOptionGroups: _itemOptionGroups,
  itemOptionItems: _itemOptionItems,

  optionGroups,
  optionItems,
  menuOptionGroups,
}: Props) {
  /* ============================================================
     MENU OPTION GROUPS
     ============================================================ */

  const menuOptionGroupIds = useMemo(() => {
  if (
    !menuId ||
    !Array.isArray(menuOptionGroups)
  ) {
    return [];
  }

  return Array.from(
    new Set(
      menuOptionGroups
        .filter(
          (row) =>
            Number(row.menu_id) ===
              Number(menuId) &&
            row.is_available === true
        )
        .map((row) =>
          Number(row.id)
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}, [
  menuId,
  menuOptionGroups,
]);

  /* ============================================================
     AVAILABLE GROUPS
     ============================================================ */

  const availableOptionGroups =
    useMemo(() => {
      if (
        !menuId ||
        !Array.isArray(optionGroups)
      ) {
        return [];
      }

      return optionGroups.filter(
        (group) =>
          menuOptionGroupIds.includes(
            Number(group.id)
          )
      );
    }, [
      optionGroups,
      menuOptionGroupIds,
      menuId,
    ]);

  /* ============================================================
     STATE
     ============================================================ */

  const [
    selectedGroups,
    setSelectedGroups,
  ] = useState<number[]>([]);

  const [
    selectedItems,
    setSelectedItems,
  ] = useState<number[]>([]);

  /*
   * Các variant của món:
   *
   * S
   * M
   * L
   *
   * ...
   */
  const [
    variants,
    setVariants,
  ] = useState<Variant[]>([]);

  /*
   * Giá option theo variant.
   *
   * key:
   *
   * optionItemId_variantId
   *
   * ví dụ:
   *
   * 12_1 = 50
   * 12_2 = 100
   */
  const [
    variantPriceMap,
    setVariantPriceMap,
  ] = useState<
    Record<string, number>
  >({});

  /*
   * ==========================================================
   * QUAN TRỌNG
   *
   * Panel giá variant KHÔNG tự động mở khi tick option.
   *
   * Chỉ mở khi:
   *
   * 1. Người dùng bấm "サイズ別料金を設定"
   * hoặc
   * 2. Option đó đang có giá variant > 0
   *
   * Ví dụ:
   *
   * ソース = 0円
   *
   * => panel đóng.
   *
   * Mサイズ +50円
   *
   * => panel tự mở để người quản lý nhìn thấy.
   * ==========================================================
   */
  const [
    expandedVariantPrices,
    setExpandedVariantPrices,
  ] = useState<
    Record<number, boolean>
  >({});

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const saveLockRef =
    useRef(false);

  const requestIdRef =
    useRef(0);

  /* ============================================================
     VARIANT PRICE KEY
     ============================================================ */

  const getVariantPriceKey =
    useCallback(
      (
        optionItemId: number,
        variantId: number
      ) =>
        `${optionItemId}_${variantId}`,
      []
    );

  /* ============================================================
     CHECK WHETHER OPTION HAS VARIANT PRICE
     ============================================================ */

  const hasVariantPrice =
    useCallback(
      (
        optionItemId: number
      ) => {
        if (
          !variants.length
        ) {
          return false;
        }

        return variants.some(
          (variant) => {
            const key =
              getVariantPriceKey(
                optionItemId,
                Number(
                  variant.id
                )
              );

            return (
              normalizePrice(
                variantPriceMap[
                  key
                ]
              ) > 0
            );
          }
        );
      },
      [
        variants,
        variantPriceMap,
        getVariantPriceKey,
      ]
    );

  /* ============================================================
     LOAD CURRENT OPTIONS
     ============================================================ */

  const loadCurrentOptions =
    useCallback(
      async () => {
        if (!itemId) {
          setSelectedGroups([]);
          setSelectedItems([]);
          setVariants([]);
          setVariantPriceMap({});
          setExpandedVariantPrices({});
          return;
        }

        const requestId =
          ++requestIdRef.current;

        setLoading(true);
        setError("");
        setSaved(false);

        try {
          const response =
            await fetch(
              `/api/store-manager/menu-item-options?menu_item_id=${encodeURIComponent(
                String(itemId)
              )}`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
                cache: "no-store",
              }
            );

          const responseText =
            await response.text();

          let data: OptionsResponse =
            {};

          if (
            responseText.trim()
          ) {
            try {
              data =
                JSON.parse(
                  responseText
                );
            } catch {
              throw new Error(
                "サーバーから不正なレスポンスが返されました。"
              );
            }
          }

          if (!response.ok) {
            throw new Error(
              data.error ??
                data.message ??
                `オプション設定を取得できませんでした。(${response.status})`
            );
          }

          if (
            data.success !== true
          ) {
            throw new Error(
              data.error ??
                data.message ??
                "オプション設定を取得できませんでした。"
            );
          }

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          /* ======================================================
             GROUPS
             ====================================================== */

          const serverGroups =
            uniquePositiveIds(
              data.option_group_ids
            );

          const validGroups =
            serverGroups.filter(
              (groupId) =>
                availableOptionGroups.some(
                  (group) =>
                    Number(
                      group.id
                    ) ===
                    Number(
                      groupId
                    )
                )
            );

          /* ======================================================
             ITEMS
             ====================================================== */

          const serverItems =
            uniquePositiveIds(
              data.option_item_ids
            );

          const validItems =
            serverItems.filter(
              (itemIdValue) => {
                const optionItem =
                  optionItems.find(
                    (item) =>
                      Number(
                        item.id
                      ) ===
                      Number(
                        itemIdValue
                      )
                  );

                if (!optionItem) {
                  return false;
                }

                if (
                  !optionItem.is_available
                ) {
                  return false;
                }

                return validGroups.includes(
                  Number(
                    optionItem.option_group_id
                  )
                );
              }
            );

          /* ======================================================
             VARIANTS
             ====================================================== */

          const serverVariants =
            Array.isArray(
              data.variants
            )
              ? data.variants
              : [];

          const validVariants =
            serverVariants.filter(
              (variant) =>
                variant.is_available !==
                false
            );

          setVariants(
            validVariants
          );

          /* ======================================================
             VARIANT PRICES
             ====================================================== */

          const nextPriceMap: Record<
            string,
            number
          > = {};

          if (
            Array.isArray(
              data.variant_prices
            )
          ) {
            for (const row of
              data.variant_prices) {
              const key =
                getVariantPriceKey(
                  Number(
                    row.option_item_id
                  ),
                  Number(
                    row.variant_id
                  )
                );

              nextPriceMap[key] =
                normalizePrice(
                  row.price
                );
            }
          }

          setVariantPriceMap(
            nextPriceMap
          );

          /*
           * ======================================================
           * PANEL STATE
           *
           * Chỉ mở những option đang thực sự có variant price > 0.
           *
           * Nếu:
           *
           * ソース
           * S = 0
           * M = 0
           * L = 0
           *
           * => đóng.
           *
           * Nếu:
           *
           * S = 0
           * M = 50
           * L = 100
           *
           * => mở.
           * ======================================================
           */

          const nextExpandedState: Record<
            number,
            boolean
          > = {};

          for (const optionItemId of
            validItems) {
            const hasPrice =
              validVariants.some(
                (variant) => {
                  const key =
                    getVariantPriceKey(
                      Number(
                        optionItemId
                      ),
                      Number(
                        variant.id
                      )
                    );

                  return (
                    normalizePrice(
                      nextPriceMap[
                        key
                      ]
                    ) > 0
                  );
                }
              );

            nextExpandedState[
              Number(
                optionItemId
              )
            ] = hasPrice;
          }

          setExpandedVariantPrices(
            nextExpandedState
          );

          setSelectedGroups(
            validGroups
          );

          setSelectedItems(
            validItems
          );
        } catch (loadError) {
          console.error(
            "[MenuItemOptions] Load error:",
            loadError
          );

          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setSelectedGroups([]);
          setSelectedItems([]);
          setVariants([]);
          setVariantPriceMap({});
          setExpandedVariantPrices({});

          setError(
            loadError instanceof Error
              ? loadError.message
              : "オプション設定を取得できません。"
          );
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
          }
        }
      },
      [
        itemId,
        availableOptionGroups,
        optionItems,
        getVariantPriceKey,
      ]
    );

  /* ============================================================
     LOAD WHEN ITEM CHANGES
     ============================================================ */

  useEffect(() => {
    setSelectedGroups([]);
    setSelectedItems([]);
    setVariants([]);
    setVariantPriceMap({});
    setExpandedVariantPrices({});

    setSaved(false);
    setError("");

    saveLockRef.current =
      false;

    if (!itemId) {
      setLoading(false);
      return;
    }

    void loadCurrentOptions();

    return () => {
      requestIdRef.current += 1;
    };
  }, [
    itemId,
    menuId,
    loadCurrentOptions,
  ]);

  /* ============================================================
     UPDATE VARIANT PRICE
     ============================================================ */

  function updateVariantPrice(
    optionItemId: number,
    variantId: number,
    value: string
  ) {
    if (
      saving ||
      loading
    ) {
      return;
    }

    setSaved(false);
    setError("");

    /*
     * "" = 0 khi save.
     */
    const price =
      value === ""
        ? 0
        : normalizePrice(
            value
          );

    const key =
      getVariantPriceKey(
        optionItemId,
        variantId
      );

    setVariantPriceMap(
      (current) => ({
        ...current,
        [key]: price,
      })
    );
  }

  /* ============================================================
     TOGGLE VARIANT PRICE PANEL
     ============================================================ */

  function toggleVariantPricePanel(
    optionItemId: number
  ) {
    if (
      saving ||
      loading
    ) {
      return;
    }

    setSaved(false);
    setError("");

    setExpandedVariantPrices(
      (current) => ({
        ...current,
        [optionItemId]:
          !current[
            optionItemId
          ],
      })
    );
  }

  /* ============================================================
     TOGGLE GROUP
     ============================================================ */

  function toggleGroup(
    groupId: number
  ) {
    if (
      loading ||
      saving ||
      saveLockRef.current
    ) {
      return;
    }

    const groupExists =
      availableOptionGroups.some(
        (group) =>
          Number(
            group.id
          ) ===
          Number(groupId)
      );

    if (!groupExists) {
      return;
    }

    setSaved(false);
    setError("");

    const isSelected =
      selectedGroups.includes(
        groupId
      );

    if (isSelected) {
      const groupItemIds =
        optionItems
          .filter(
            (optionItem) =>
              Number(
                optionItem.option_group_id
              ) ===
                Number(
                  groupId
                ) &&
              optionItem.is_available
          )
          .map(
            (optionItem) =>
              Number(
                optionItem.id
              )
          );

      setSelectedGroups(
        (current) =>
          current.filter(
            (id) =>
              id !== groupId
          )
      );

      setSelectedItems(
        (current) =>
          current.filter(
            (id) =>
              !groupItemIds.includes(
                id
              )
          )
      );

      /*
       * Xóa giá tạm của option
       * thuộc group bị bỏ.
       */

      setVariantPriceMap(
        (current) => {
          const next = {
            ...current,
          };

          for (const optionItemId of
            groupItemIds) {
            for (const variant of
              variants) {
              delete next[
                getVariantPriceKey(
                  optionItemId,
                  variant.id
                )
              ];
            }
          }

          return next;
        }
      );

      /*
       * Đóng toàn bộ panel của group.
       */

      setExpandedVariantPrices(
        (current) => {
          const next = {
            ...current,
          };

          for (const optionItemId of
            groupItemIds) {
            delete next[
              optionItemId
            ];
          }

          return next;
        }
      );

      return;
    }

    setSelectedGroups(
      (current) => {
        if (
          current.includes(
            groupId
          )
        ) {
          return current;
        }

        return [
          ...current,
          groupId,
        ];
      }
    );
  }

  /* ============================================================
     TOGGLE ITEM
     ============================================================ */

  function toggleItem(
    optionItemId: number
  ) {
    if (
      loading ||
      saving ||
      saveLockRef.current
    ) {
      return;
    }

    setSaved(false);
    setError("");

    const optionItem =
      optionItems.find(
        (item) =>
          Number(item.id) ===
          Number(
            optionItemId
          )
      );

    if (!optionItem) {
      return;
    }

    if (
      !optionItem.is_available
    ) {
      return;
    }

    if (
      !selectedGroups.includes(
        Number(
          optionItem.option_group_id
        )
      )
    ) {
      return;
    }

    const isSelected =
      selectedItems.includes(
        optionItemId
      );

    if (isSelected) {
      setSelectedItems(
        (current) =>
          current.filter(
            (id) =>
              id !== optionItemId
          )
      );

      /*
       * Bỏ chọn option =>
       * xóa giá theo variant khỏi state.
       */

      setVariantPriceMap(
        (current) => {
          const next = {
            ...current,
          };

          for (const variant of
            variants) {
            delete next[
              getVariantPriceKey(
                optionItemId,
                variant.id
              )
            ];
          }

          return next;
        }
      );

      /*
       * Bỏ chọn option =>
       * đóng panel.
       */

      setExpandedVariantPrices(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            optionItemId
          ];

          return next;
        }
      );

      return;
    }

    /*
     * Chỉ chọn option.
     *
     * KHÔNG tự động mở variant price panel.
     *
     * Ví dụ:
     *
     * ソース = 無料
     *
     * => chỉ tick option.
     */

    setSelectedItems(
      (current) => [
        ...current,
        optionItemId,
      ]
    );

    /*
     * Panel mặc định đóng khi option mới được chọn.
     */

    setExpandedVariantPrices(
      (current) => ({
        ...current,
        [optionItemId]: false,
      })
    );
  }

  /* ============================================================
     BUILD PAYLOAD
     ============================================================ */

  const buildPayload =
    useCallback(() => {
      const validGroups =
        uniquePositiveIds(
          selectedGroups
        ).filter(
          (groupId) =>
            availableOptionGroups.some(
              (group) =>
                Number(
                  group.id
                ) ===
                Number(
                  groupId
                )
            )
        );

      const validItems =
        uniquePositiveIds(
          selectedItems
        ).filter(
          (optionItemId) => {
            const optionItem =
              optionItems.find(
                (item) =>
                  Number(
                    item.id
                  ) ===
                  Number(
                    optionItemId
                  )
              );

            if (!optionItem) {
              return false;
            }

            if (
              !optionItem.is_available
            ) {
              return false;
            }

            return validGroups.includes(
              Number(
                optionItem.option_group_id
              )
            );
          }
        );

      /*
       * option_item_id
       * +
       * variant_id
       * +
       * price
       */

      const variant_prices: VariantPrice[] =
        [];

      for (const optionItemId of
        validItems) {
        for (const variant of
          variants) {
          const key =
            getVariantPriceKey(
              optionItemId,
              variant.id
            );

          const price =
            normalizePrice(
              variantPriceMap[
                key
              ]
            );

          /*
           * Chỉ lưu giá > 0.
           *
           * 0円:
           * Không cần record variant_price.
           *
           * Nhưng option_item_id
           * vẫn được lưu bình thường.
           */

          if (price > 0) {
            variant_prices.push({
              option_item_id:
                optionItemId,

              variant_id:
                variant.id,

              price,
            });
          }
        }
      }

      return {
        option_group_ids:
          validGroups,

        option_item_ids:
          validItems,

        variant_prices,
      };
    }, [
      selectedGroups,
      selectedItems,
      availableOptionGroups,
      optionItems,
      variants,
      variantPriceMap,
      getVariantPriceKey,
    ]);

  /* ============================================================
     SAVE
     ============================================================ */

  async function handleSave() {
    if (
      saveLockRef.current
    ) {
      return;
    }

    if (!itemId) {
      setError(
        "商品を先に保存してください。"
      );
      return;
    }

    if (!menuId) {
      setError(
        "メニューが選択されていません。"
      );
      return;
    }

    saveLockRef.current =
      true;

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const payload =
        buildPayload();

      console.log(
        "[MenuItemOptions] Saving:",
        {
          menuId,
          itemId,
          ...payload,
        }
      );

      const response =
        await fetch(
          "/api/store-manager/menu-item-options",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            cache: "no-store",

            body: JSON.stringify({
              menu_item_id:
                itemId,

              option_group_ids:
                payload.option_group_ids,

              option_item_ids:
                payload.option_item_ids,

              variant_prices:
                payload.variant_prices,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: OptionsResponse =
        {};

      if (
        responseText.trim()
      ) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          console.error(
            "[MenuItemOptions] PUT response:",
            responseText
          );

          throw new Error(
            "サーバーから不正なレスポンスが返されました。"
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            data.message ??
            `オプションを保存できませんでした。(${response.status})`
        );
      }

      if (
        data.success !== true
      ) {
        throw new Error(
          data.error ??
            data.message ??
            "オプションを保存できません。"
        );
      }

      /* ======================================================
         SERVER RESPONSE
         ====================================================== */

      const savedGroups =
        uniquePositiveIds(
          data.option_group_ids
        ).filter(
          (groupId) =>
            availableOptionGroups.some(
              (group) =>
                Number(
                  group.id
                ) ===
                Number(
                  groupId
                )
            )
        );

      const savedItems =
        uniquePositiveIds(
          data.option_item_ids
        ).filter(
          (itemIdValue) => {
            const optionItem =
              optionItems.find(
                (item) =>
                  Number(
                    item.id
                  ) ===
                  Number(
                    itemIdValue
                  )
              );

            if (!optionItem) {
              return false;
            }

            if (
              !optionItem.is_available
            ) {
              return false;
            }

            return savedGroups.includes(
              Number(
                optionItem.option_group_id
              )
            );
          }
        );

      const savedPriceMap: Record<
        string,
        number
      > = {};

      if (
        Array.isArray(
          data.variant_prices
        )
      ) {
        for (const row of
          data.variant_prices) {
          const key =
            getVariantPriceKey(
              Number(
                row.option_item_id
              ),
              Number(
                row.variant_id
              )
            );

          savedPriceMap[key] =
            normalizePrice(
              row.price
            );
        }
      }

      setSelectedGroups(
        savedGroups
      );

      setSelectedItems(
        savedItems
      );

      setVariantPriceMap(
        savedPriceMap
      );

      /*
       * Sau khi save:
       *
       * option có variant price > 0
       * => mở
       *
       * option toàn 0
       * => đóng
       */

      const nextExpandedState: Record<
        number,
        boolean
      > = {};

      for (const optionItemId of
        savedItems) {
        const hasPrice =
          variants.some(
            (variant) => {
              const key =
                getVariantPriceKey(
                  Number(
                    optionItemId
                  ),
                  Number(
                    variant.id
                  )
                );

              return (
                normalizePrice(
                  savedPriceMap[
                    key
                  ]
                ) > 0
              );
            }
          );

        nextExpandedState[
          Number(
            optionItemId
          )
        ] = hasPrice;
      }

      setExpandedVariantPrices(
        nextExpandedState
      );

      setSaved(true);

      console.log(
        "[MenuItemOptions] Saved successfully:",
        {
          menuId,
          itemId,
          option_group_ids:
            savedGroups,
          option_item_ids:
            savedItems,
          variant_prices:
            data.variant_prices,
        }
      );
    } catch (saveError) {
      console.error(
        "[MenuItemOptions] Save error:",
        saveError
      );

      setSaved(false);

      setError(
        saveError instanceof Error
          ? saveError.message
          : "オプションを保存できません。"
      );
    } finally {
      setSaving(false);

      saveLockRef.current =
        false;
    }
  }

  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <div
      className={
        styles.container
      }
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className={
          styles.header
        }
      >
        <div
          className={
            styles.iconBadge
          }
        >
          <SlidersHorizontal
            size={20}
          />
        </div>

        <div>
          <h3>
            オプション設定
          </h3>

          <p>
            この商品で使用するオプションと詳細項目を選択します。
          </p>
        </div>
      </div>

      {/* ======================================================
          NO ITEM
          ====================================================== */}

      {!itemId && (
        <div
          className={
            styles.emptyState
          }
        >
          <AlertCircle
            size={18}
          />

          <span>
            商品を一度保存するとオプションを設定できます。
          </span>
        </div>
      )}

      {/* ======================================================
          NO MENU
          ====================================================== */}

      {itemId &&
        !menuId && (
          <div
            className={
              styles.emptyState
            }
          >
            <AlertCircle
              size={18}
            />

            <span>
              メニューが選択されていません。
            </span>
          </div>
        )}

      {/* ======================================================
          LOADING
          ====================================================== */}

      {itemId &&
        menuId &&
        loading && (
          <div
            className={
              styles.emptyState
            }
          >
            <Loader2
              size={18}
              className={
                styles.spin
              }
            />

            <span>
              オプション設定を読み込み中...
            </span>
          </div>
        )}

      {/* ======================================================
          NO GROUP
          ====================================================== */}

      {itemId &&
        menuId &&
        !loading &&
        availableOptionGroups.length ===
          0 && (
          <div
            className={
              styles.emptyState
            }
          >
            <AlertCircle
              size={18}
            />

            <span>
              このメニューには利用可能なオプショングループがありません。
            </span>
          </div>
        )}

      {/* ======================================================
          OPTION GROUPS
          ====================================================== */}

      {itemId &&
        menuId &&
        !loading &&
        availableOptionGroups.length >
          0 && (
          <div
            className={
              styles.groupList
            }
          >
            {availableOptionGroups.map(
              (group) => {
                const isGroupChecked =
                  selectedGroups.includes(
                    Number(
                      group.id
                    )
                  );

                const children =
                  optionItems.filter(
                    (option) =>
                      Number(
                        option.option_group_id
                      ) ===
                        Number(
                          group.id
                        ) &&
                      option.is_available
                  );

                const selectedChildCount =
                  children.filter(
                    (child) =>
                      selectedItems.includes(
                        Number(
                          child.id
                        )
                      )
                  ).length;

                return (
                  <div
                    key={
                      group.id
                    }
                    className={`${styles.groupCard} ${
                      isGroupChecked
                        ? styles.groupActive
                        : ""
                    }`}
                  >
                    {/* ==================================================
                        GROUP HEADER
                        ================================================== */}

                    <div
                      className={
                        styles.groupHeader
                      }
                      onClick={() =>
                        toggleGroup(
                          Number(
                            group.id
                          )
                        )
                      }
                    >
                      <label
                        className={
                          styles.checkboxContainer
                        }
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            isGroupChecked
                          }
                          onChange={() =>
                            toggleGroup(
                              Number(
                                group.id
                              )
                            )
                          }
                          disabled={
                            saving ||
                            loading
                          }
                        />

                        <span
                          className={
                            styles.customCheckbox
                          }
                        >
                          <Check
                            size={
                              14
                            }
                            className={
                              styles.checkIcon
                            }
                          />
                        </span>
                      </label>

                      <div
                        className={
                          styles.groupTitleInfo
                        }
                      >
                        <strong>
                          {
                            group.name_ja
                          }
                        </strong>

                        {group.code && (
                          <span
                            className={
                              styles.groupCode
                            }
                          >
                            {
                              group.code
                            }
                          </span>
                        )}
                      </div>

                      {isGroupChecked &&
                        children.length >
                          0 && (
                          <span
                            className={
                              styles.selectedBadge
                            }
                          >
                            {
                              selectedChildCount
                            }
                            /
                            {
                              children.length
                            }{" "}
                            選択中
                          </span>
                        )}
                    </div>

                    {/* ==================================================
                        GROUP ITEMS
                        ================================================== */}

                    {isGroupChecked && (
                      <div
                        className={
                          styles.itemsContainer
                        }
                      >
                        {children.length >
                        0 ? (
                          <div
                            className={
                              styles.itemsList
                            }
                          >
                            {children.map(
                              (
                                child
                              ) => {
                                const childId =
                                  Number(
                                    child.id
                                  );

                                const isItemChecked =
                                  selectedItems.includes(
                                    childId
                                  );

                                const isVariantPanelOpen =
                                  Boolean(
                                    expandedVariantPrices[
                                      childId
                                    ]
                                  );

                                const itemHasVariantPrice =
                                  hasVariantPrice(
                                    childId
                                  );

                                return (
                                  <div
                                    key={
                                      child.id
                                    }
                                    className={`${styles.optionItemRow} ${
                                      isItemChecked
                                        ? styles.optionItemRowActive
                                        : ""
                                    }`}
                                  >
                                    {/* ==========================================
                                        OPTION ITEM
                                        ========================================== */}

                                    <label
                                      className={
                                        styles.itemSelector
                                      }
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          isItemChecked
                                        }
                                        onChange={() =>
                                          toggleItem(
                                            childId
                                          )
                                        }
                                        disabled={
                                          saving ||
                                          loading
                                        }
                                      />

                                      <span
                                        className={
                                          styles.itemCheckbox
                                        }
                                      >
                                        <Check
                                          size={
                                            13
                                          }
                                          strokeWidth={
                                            3
                                          }
                                        />
                                      </span>

                                      <span
                                        className={
                                          styles.itemMain
                                        }
                                      >
                                        <span
                                          className={
                                            styles.itemName
                                          }
                                        >
                                          {
                                            child.name_ja
                                          }
                                        </span>

                                        <span
                                          className={
                                            styles.itemMeta
                                          }
                                        >
                                          {Number(
                                            child.price
                                          ) >
                                          0 ? (
                                            <>
                                              基本追加料金

                                              <strong
                                                className={
                                                  styles.itemPrice
                                                }
                                              >
                                                +¥
                                                {Number(
                                                  child.price
                                                ).toLocaleString(
                                                  "ja-JP"
                                                )}
                                              </strong>
                                            </>
                                          ) : (
                                            <span
                                              className={
                                                styles.freePrice
                                              }
                                            >
                                              無料
                                            </span>
                                          )}
                                        </span>
                                      </span>

                                      {isItemChecked && (
                                        <span
                                          className={
                                            styles.selectedMark
                                          }
                                        >
                                          選択中
                                        </span>
                                      )}
                                    </label>

                                    {/* ==========================================
                                        VARIANT PRICE TOGGLE
                                        ========================================== */}

                                    {isItemChecked &&
                                      variants.length >
                                        0 && (
                                        <div
                                          className={
                                            styles.variantPriceToggleWrapper
                                          }
                                        >
                                          <button
                                            type="button"
                                            className={`${styles.variantPriceToggle} ${
                                              isVariantPanelOpen
                                                ? styles.variantPriceToggleActive
                                                : ""
                                            }`}
                                            onClick={() =>
                                              toggleVariantPricePanel(
                                                childId
                                              )
                                            }
                                            disabled={
                                              saving ||
                                              loading
                                            }
                                          >
                                            <span
                                              className={
                                                styles.variantPriceToggleIcon
                                              }
                                            >
                                              ¥
                                            </span>

                                            <span
                                              className={
                                                styles.variantPriceToggleText
                                              }
                                            >
                                              <strong>
                                                {isVariantPanelOpen
                                                  ? "サイズ別料金を閉じる"
                                                  : "サイズ別料金を設定"}
                                              </strong>

                                              {!isVariantPanelOpen && (
                                                <small>
                                                  {itemHasVariantPrice
                                                    ? "サイズごとの追加料金を設定済み"
                                                    : "通常は設定不要です"}
                                                </small>
                                              )}
                                            </span>

                                            {isVariantPanelOpen ? (
                                              <ChevronUp
                                                size={
                                                  18
                                                }
                                              />
                                            ) : (
                                              <ChevronDown
                                                size={
                                                  18
                                                }
                                              />
                                            )}
                                          </button>
                                        </div>
                                      )}

                                    {/* ==========================================
                                        VARIANT PRICE PANEL

                                        CHỈ HIỆN KHI NGƯỜI DÙNG BẤM NÚT
                                        ========================================== */}

                                    {isItemChecked &&
                                      variants.length >
                                        0 &&
                                      isVariantPanelOpen && (
                                        <div
                                          className={
                                            styles.variantPricePanel
                                          }
                                        >
                                          <div
                                            className={
                                              styles.variantPriceHeader
                                            }
                                          >
                                            <div
                                              className={
                                                styles.variantPriceTitle
                                              }
                                            >
                                              <span
                                                className={
                                                  styles.variantPriceIcon
                                                }
                                              >
                                                ¥
                                              </span>

                                              <div>
                                                <strong>
                                                  サイズごとの追加料金
                                                </strong>

                                                <span>
                                                  サイズごとに追加料金を設定できます
                                                </span>
                                              </div>
                                            </div>

                                            
                                          </div>

                                          <div
                                            className={
                                              styles.variantPriceGrid
                                            }
                                          >
                                            {variants.map(
                                              (
                                                variant
                                              ) => {
                                                const key =
                                                  getVariantPriceKey(
                                                    childId,
                                                    Number(
                                                      variant.id
                                                    )
                                                  );

                                                const value =
                                                  variantPriceMap[
                                                    key
                                                  ] ??
                                                  0;

                                                return (
                                                  <div
                                                    key={
                                                      variant.id
                                                    }
                                                    className={
                                                      styles.variantPriceCard
                                                    }
                                                  >
                                                    <div
                                                      className={
                                                        styles.variantInfo
                                                      }
                                                    >
                                                      <span
                                                        className={
                                                          styles.variantName
                                                        }
                                                      >
                                                        {
                                                          variant.name_ja
                                                        }
                                                      </span>

                                                
                                                    </div>

                                                    <div
                                                      className={
                                                        styles.priceInputWrapper
                                                      }
                                                    >
                                                      <span
                                                        className={
                                                          styles.pricePrefix
                                                        }
                                                      >
                                                        +¥
                                                      </span>

                                                      <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                          value ===
                                                          0
                                                            ? ""
                                                            : value
                                                        }
                                                        onChange={(
                                                          event
                                                        ) =>
                                                          updateVariantPrice(
                                                            childId,
                                                            Number(
                                                              variant.id
                                                            ),
                                                            event
                                                              .target
                                                              .value
                                                          )
                                                        }
                                                        disabled={
                                                          saving ||
                                                          loading
                                                        }
                                                        placeholder="0"
                                                        className={
                                                          styles.variantPriceInput
                                                        }
                                                      />
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            )}
                                          </div>

                                          {/* ====================================
                                              CLOSE BUTTON
                                              ==================================== */}

                                          <div
                                            className={
                                              styles.variantPriceFooter
                                            }
                                          >
                                            <button
                                              type="button"
                                              className={
                                                styles.variantPriceCloseButton
                                              }
                                              onClick={() =>
                                                toggleVariantPricePanel(
                                                  childId
                                                )
                                              }
                                              disabled={
                                                saving ||
                                                loading
                                              }
                                            >
                                              <ChevronUp
                                                size={
                                                  16
                                                }
                                              />

                                              サイズ別料金を閉じる
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                    {/* ==========================================
                                        NO VARIANTS
                                        ========================================== */}

                                    {isItemChecked &&
                                      variants.length ===
                                        0 && (
                                        <div
                                          className={
                                            styles.noVariantWarning
                                          }
                                        >
                                          <AlertCircle
                                            size={
                                              15
                                            }
                                          />

                                          <span>
                                            この商品にはバリエーションが登録されていません。
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <p
                            className={
                              styles.noItemsText
                            }
                          >
                            このグループには項目が登録されていません。
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

      {/* ======================================================
          FOOTER
          ====================================================== */}

      {itemId &&
        menuId &&
        !loading &&
        availableOptionGroups.length >
          0 && (
          <div
            className={
              styles.footerInfo
            }
          >
            {error && (
              <div
                className={
                  styles.error
                }
                role="alert"
              >
                <AlertCircle
                  size={18}
                />

                <span>
                  {error}
                </span>
              </div>
            )}

            {saved &&
              !error && (
                <div
                  className={
                    styles.successMessage
                  }
                >
                  <Check
                    size={18}
                  />

                  <span>
                    オプション設定を保存しました。
                  </span>
                </div>
              )}

            <span>
              選択中:{" "}
              <strong>
                {
                  selectedGroups.length
                }
              </strong>{" "}
              グループ /
              <strong>
                {
                  selectedItems.length
                }
              </strong>{" "}
              項目
            </span>

            <button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                saving ||
                loading
              }
              className={
                styles.saveButton
              }
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className={
                      styles.spin
                    }
                  />

                  保存中...
                </>
              ) : (
                <>
                  <Save
                    size={17}
                  />

                  保存する
                </>
              )}
            </button>
          </div>
        )}
    </div>
  );
}