import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/prisma';

import {
  NormalizedCheckoutInput,
  NormalizedCheckoutItem,
  ValidationError,
} from '@/validators/order.schema';

import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';

// ============================================================
// TYPES
// ============================================================

interface PricedOrderOption {
  menuOptionItemId: number;
  groupId: number;
  groupCode: string;
  groupNameSnapshot: string;
  groupNameJaSnapshot: string;
  optionCode: string;
  optionNameSnapshot: string;
  optionNameJaSnapshot: string;
  additionalPrice: number;
}

interface PricedOrderItem {
  input: NormalizedCheckoutItem;

  menuItemId: number;

  foodNameSnapshot: string;
  foodNameJaSnapshot: string;

  imageSnapshot: string | null;

  basePrice: number;

  // ==========================================================
  // VARIANT / SIZE
  // ==========================================================
  variantCode: string | null;
  variantNameSnapshot: string | null;
  variantNameJaSnapshot: string | null;

  options: PricedOrderOption[];

  optionTotal: number;
  lineTotal: number;
}

export interface CheckoutOrderPaymentContext {
  order: {
    id: bigint;
    orderToken: string;
    orderNumber: number;
    totalAmount: number;
    currency: string;
    status: string | null;
  };

  payment: {
    id: bigint;
    status: string | null;
    transactionId: string | null;
    clientSecret: string | null;
    amount: number;
    currency: string;
  };

  shouldCreatePaymentIntent: boolean;
  createdNewPayment: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_CURRENCY = 'JPY';

const MIN_ORDER_NUMBER = 300;
const MAX_ORDER_NUMBER = 999;

const ORDER_TRANSACTION_OPTIONS = {
  maxWait: 2000,
  timeout: 8000,
  isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel,
} as const;

const PAYMENT_TRANSACTION_OPTIONS = {
  maxWait: 2000,
  timeout: 5000,
  isolationLevel: 'ReadCommitted' as Prisma.TransactionIsolationLevel,
} as const;

// ============================================================
// BASIC HELPERS
// ============================================================

function createOrderToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0;
  }

  let result: number;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as { toNumber?: unknown }).toNumber === 'function'
  ) {
    result = (value as { toNumber: () => number }).toNumber();
  } else if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    result = Number(value);
  } else {
    result = Number(String(value));
  }

  if (!Number.isFinite(result)) {
    throw new Error(
      `Invalid numeric database value: ${String(value)}`
    );
  }

  return result;
}

// ============================================================
// LOCALE
// ============================================================

type SupportedLocale = 'ja' | 'vi' | 'en' | 'zh';

function normalizeLocale(locale: string): SupportedLocale {
  switch (locale) {
    case 'ja':
    case 'vi':
    case 'en':
    case 'zh':
      return locale;

    default:
      return 'ja';
  }
}

function getLocalizedName(
  obj: {
    name_ja?: string | null;
    name_vi?: string | null;
    name_en?: string | null;
    name_zh?: string | null;
  },
  locale: string
): string | null {
  const currentLocale = normalizeLocale(locale);

  const names: Record<
    SupportedLocale,
    string | null | undefined
  > = {
    ja: obj.name_ja,
    vi: obj.name_vi,
    en: obj.name_en,
    zh: obj.name_zh,
  };

  return (
    names[currentLocale] ??
    obj.name_ja ??
    obj.name_en ??
    obj.name_vi ??
    obj.name_zh ??
    null
  );
}

function getGroupDisplayName(
  mapping: {
    display_name_ja?: string | null;
    display_name_vi?: string | null;
    display_name_en?: string | null;
    display_name_zh?: string | null;
  },
  groupInfo: {
    name_ja?: string | null;
    name_vi?: string | null;
    name_en?: string | null;
    name_zh?: string | null;
  },
  locale: string
): string {
  const currentLocale = normalizeLocale(locale);

  const names: Record<
    SupportedLocale,
    string | null | undefined
  > = {
    ja: mapping.display_name_ja ?? groupInfo.name_ja,
    vi: mapping.display_name_vi ?? groupInfo.name_vi,
    en: mapping.display_name_en ?? groupInfo.name_en,
    zh: mapping.display_name_zh ?? groupInfo.name_zh,
  };

  return (
    names[currentLocale] ??
    mapping.display_name_ja ??
    groupInfo.name_ja ??
    mapping.display_name_en ??
    groupInfo.name_en ??
    mapping.display_name_vi ??
    groupInfo.name_vi ??
    mapping.display_name_zh ??
    groupInfo.name_zh ??
    'Option'
  );
}

// ============================================================
// JAPAN DATE
// ============================================================

function getJapanDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// ============================================================
// ORDER NUMBER
// ============================================================

async function getNextOrderNumber(
  tx: Prisma.TransactionClient,
  storeId: number
): Promise<number> {
  const orderDate = getJapanDateString();

  await tx.$executeRaw`
    INSERT INTO tbl_daily_order_numbers
      (store_id, order_date, last_number)
    VALUES
      (${storeId}, ${orderDate}, ${MIN_ORDER_NUMBER})
    ON DUPLICATE KEY UPDATE
      last_number = last_number + 1
  `;

  const rows = await tx.$queryRaw<
    Array<{ last_number: number | bigint }>
  >`
    SELECT last_number
    FROM tbl_daily_order_numbers
    WHERE store_id = ${storeId}
      AND order_date = ${orderDate}
    FOR UPDATE
  `;

  if (rows.length !== 1) {
    throw new Error(
      `Unable to generate order number for store ${storeId}`
    );
  }

  const orderNumber = Number(rows[0].last_number);

  if (
    !Number.isInteger(orderNumber) ||
    orderNumber < MIN_ORDER_NUMBER ||
    orderNumber > MAX_ORDER_NUMBER
  ) {
    throw new ValidationError(
      `Daily order number limit exceeded for store ${storeId}`,
      {
        code: 'ORDER_NUMBER_LIMIT_REACHED',
      }
    );
  }

  return orderNumber;
}

// ============================================================
// PRICE ONE ITEM
// ============================================================

async function priceItem(
  storeId: number,
  input: NormalizedCheckoutItem,
  locale: string
): Promise<PricedOrderItem> {
  console.log('[Checkout] PRICE ITEM INPUT', {
    storeId,
    menuItemId: input.menuItemId,
    variantId: input.variantId,
    variantCode: input.variantCode,
    selectedOptionIds: input.selectedOptionIds,
    quantity: input.quantity,
    note: input.note,
  });

  // ==========================================================
  // QUANTITY
  // ==========================================================

  if (
    !Number.isInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new ValidationError('Invalid item quantity', {
      code: 'INVALID_QUANTITY',
      item: {
        menuItemId: input.menuItemId,
        name: 'Item',
      },
      details: {
        quantity: input.quantity,
      },
    });
  }

  // ==========================================================
  // MENU ITEM
  // ==========================================================

  const menuItem = await db.tbl_menu_item.findFirst({
    where: {
      id: input.menuItemId,
      status: 'ACTIVE',
      discontinued_at: null,
    },
  });

  if (!menuItem) {
    throw new ValidationError(
      `Menu item ${input.menuItemId} is invalid or unavailable`,
      {
        code: 'ITEM_UNAVAILABLE',
        item: {
          menuItemId: input.menuItemId,
        },
      }
    );
  }

  const foodNameSnapshot =
    getLocalizedName(menuItem, locale) ??
    menuItem.name_ja ??
    'Item';

  const foodNameJaSnapshot =
    menuItem.name_ja ??
    foodNameSnapshot;

  // ==========================================================
  // OPTION GROUPS
  // ==========================================================

  const groupsMapping =
    await db.tbl_menu_item_option_groups.findMany({
      where: {
        menu_item_id: menuItem.id,
        is_available: true,
      },

      include: {
        tbl_menu_option_groups: true,
      },

      orderBy: {
        sort_order: 'asc',
      },
    });

  const groupMap = new Map<
    number,
    {
      mapping: (typeof groupsMapping)[number];
      groupInfo: (typeof groupsMapping)[number]['tbl_menu_option_groups'];
    }
  >();

  for (const gm of groupsMapping) {
    groupMap.set(gm.option_group_id, {
      mapping: gm,
      groupInfo: gm.tbl_menu_option_groups,
    });
  }

  // ==========================================================
  // VARIANT / SIZE
  // ==========================================================

  let variantId: number | null =
    input.variantId ?? null;

  let variantCode: string | null =
    input.variantCode ?? null;

  let variantNameSnapshot: string | null = null;

  let variantNameJaSnapshot: string | null = null;

  let variantPrice = 0;

  if (
    variantId !== null ||
    variantCode !== null
  ) {
    const variant =
      await db.tbl_menu_item_variants.findFirst({
        where: {
          menu_item_id: menuItem.id,

          is_available: true,

          deleted_at: null,

          ...(variantId !== null
            ? {
                id: variantId,
              }
            : {}),

          ...(variantCode !== null
            ? {
                code: variantCode,
              }
            : {}),
        },
      });

    if (!variant) {
      throw new ValidationError(
        'Selected variant is invalid',
        {
          code: 'INVALID_VARIANT',

          item: {
            menuItemId: menuItem.id,
            name: foodNameSnapshot,
          },

          details: {
            variantId,
            variantCode,
          },
        }
      );
    }

    // ----------------------------------------------------------
    // IMPORTANT
    // Always use the variant returned from DB.
    // Never trust variant name/price from client.
    // ----------------------------------------------------------

    variantId = variant.id;

    variantCode = variant.code;

    variantNameSnapshot =
      getLocalizedName(
        variant,
        locale
      );

    variantNameJaSnapshot =
      variant.name_ja ?? null;

    variantPrice =
      toNumber(variant.price);

    console.log(
      '[Checkout] VARIANT RESOLVED',
      {
        menuItemId: menuItem.id,
        variantId,
        variantCode,
        variantNameSnapshot,
        variantNameJaSnapshot,
        variantPrice,
      }
    );
  }

  // ==========================================================
  // SELECTED OPTIONS
  // ==========================================================

  const groupIds =
    Array.from(groupMap.keys());

  const selectedOptionIds =
    Array.from(
      new Set(
        (input.selectedOptionIds ?? [])
          .filter(
            (
              id
            ): id is number =>
              Number.isInteger(id) &&
              id > 0
          )
      )
    );

  if (
    selectedOptionIds.length > 0 &&
    groupIds.length === 0
  ) {
    throw new ValidationError(
      'Selected options are not available for this item',
      {
        code: 'INVALID_OPTION',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          selectedOptionIds,
        },
      }
    );
  }

  type SelectedOption = {
    id: number;
    option_group_id: number;
    code: string;

    name_ja: string | null;
    name_vi: string | null;
    name_en: string | null;
    name_zh: string | null;

    price: Prisma.Decimal;

    icon_url: string | null;
    is_available: boolean;

    tbl_menu_option_groups: {
      id: number;
      code: string;

      name_ja: string | null;
      name_vi: string | null;
      name_en: string | null;
      name_zh: string | null;
    };
  };

  let selectedOptions: SelectedOption[] = [];

  if (
    selectedOptionIds.length > 0 &&
    groupIds.length > 0
  ) {
    selectedOptions =
      await db.tbl_menu_option_items.findMany({
        where: {
          id: {
            in: selectedOptionIds,
          },

          is_available: true,

          option_group_id: {
            in: groupIds,
          },
        },

        include: {
          tbl_menu_option_groups: {
            select: {
              id: true,
              code: true,
              name_ja: true,
              name_vi: true,
              name_en: true,
              name_zh: true,
            },
          },
        },
      });
  }

  if (
    selectedOptions.length !==
    selectedOptionIds.length
  ) {
    throw new ValidationError(
      'One or more selected options are invalid',
      {
        code: 'INVALID_OPTION',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          selectedOptionIds,

          foundOptionIds:
            selectedOptions.map(
              (option) => option.id
            ),
        },
      }
    );
  }

  // ==========================================================
  // VARIANT-SPECIFIC OPTION PRICES
  // ==========================================================

  const variantPriceMap =
    new Map<number, number>();

  if (
    variantId !== null &&
    selectedOptionIds.length > 0
  ) {
    const variantPrices =
      await db.tbl_menu_option_item_variant_prices.findMany(
        {
          where: {
            option_item_id: {
              in: selectedOptionIds,
            },

            variant_id: variantId,
          },

          select: {
            option_item_id: true,
            variant_id: true,
            price: true,
          },
        }
      );

    for (const vp of variantPrices) {
      variantPriceMap.set(
        vp.option_item_id,
        toNumber(vp.price)
      );
    }
  }

  // ==========================================================
  // VALIDATE OPTION GROUPS
  // ==========================================================

  for (const [
    groupId,
    { mapping, groupInfo },
  ] of groupMap) {
    const selectedForGroup =
      selectedOptions.filter(
        (option) =>
          option.option_group_id === groupId
      );

    const groupDisplayName =
      getGroupDisplayName(
        mapping,
        groupInfo,
        locale
      );

    if (
      mapping.is_required &&
      selectedForGroup.length === 0
    ) {
      throw new ValidationError(
        'Required option is missing',
        {
          code: 'REQUIRED_OPTION_MISSING',

          item: {
            menuItemId: menuItem.id,
            name: foodNameSnapshot,
          },

          details: {
            groupCode: groupInfo.code,
            groupName: groupDisplayName,
          },
        }
      );
    }

    const maxChoices =
      mapping.max_choices ?? null;

    if (
      maxChoices !== null &&
      selectedForGroup.length > maxChoices
    ) {
      throw new ValidationError(
        'Too many options selected',
        {
          code: 'TOO_MANY_OPTIONS',

          item: {
            menuItemId: menuItem.id,
            name: foodNameSnapshot,
          },

          details: {
            groupCode: groupInfo.code,
            groupName: groupDisplayName,
            maxChoices,
            selectedCount:
              selectedForGroup.length,
          },
        }
      );
    }
  }

  // ==========================================================
  // PRICE OPTIONS
  // ==========================================================

  const pricedOptions: PricedOrderOption[] =
    selectedOptions.map((option) => {
      const groupId =
        option.option_group_id;

      const group =
        groupMap.get(groupId);

      if (!group) {
        throw new ValidationError(
          'Option group is invalid',
          {
            code: 'INVALID_OPTION_GROUP',

            item: {
              menuItemId: menuItem.id,
              name: foodNameSnapshot,
            },

            details: {
              optionId: option.id,
              groupId,
            },
          }
        );
      }

      const {
        mapping,
        groupInfo,
      } = group;

      const groupDisplayName =
        getGroupDisplayName(
          mapping,
          groupInfo,
          locale
        );

      const groupJaName =
        mapping.display_name_ja ??
        groupInfo.name_ja ??
        '';

      const optionNameSnapshot =
        getLocalizedName(
          option,
          locale
        ) ??
        option.name_ja ??
        '';

      const optionNameJaSnapshot =
        option.name_ja ??
        '';

      let additionalPrice: number;

      if (
        variantId !== null &&
        variantPriceMap.has(option.id)
      ) {
        additionalPrice =
          variantPriceMap.get(option.id)!;
      } else {
        additionalPrice =
          toNumber(option.price);
      }

      if (
        !Number.isFinite(additionalPrice) ||
        additionalPrice < 0
      ) {
        throw new ValidationError(
          'Invalid option price',
          {
            code: 'INVALID_OPTION_PRICE',

            item: {
              menuItemId: menuItem.id,
              name: foodNameSnapshot,
            },

            details: {
              optionId: option.id,
              optionCode: option.code,
              additionalPrice,
              variantId,
            },
          }
        );
      }

      return {
        menuOptionItemId: option.id,

        groupId,

        groupCode:
          groupInfo.code,

        groupNameSnapshot:
          groupDisplayName,

        groupNameJaSnapshot:
          groupJaName,

        optionCode:
          option.code,

        optionNameSnapshot:
          optionNameSnapshot,

        optionNameJaSnapshot:
          optionNameJaSnapshot,

        additionalPrice,
      };
    });

  // ==========================================================
  // FINAL PRICE CALCULATION
  // ==========================================================

  const menuItemPrice =
    toNumber(menuItem.price);

  if (
    !Number.isFinite(menuItemPrice) ||
    menuItemPrice < 0
  ) {
    throw new ValidationError(
      'Invalid menu item price',
      {
        code: 'INVALID_ITEM_PRICE',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          menuItemPrice,
        },
      }
    );
  }

  if (
    !Number.isFinite(variantPrice) ||
    variantPrice < 0
  ) {
    throw new ValidationError(
      'Invalid variant price',
      {
        code: 'INVALID_VARIANT_PRICE',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          variantId,
          variantCode,
          variantPrice,
        },
      }
    );
  }

  // ==========================================================
  // PRICE RULE
  //
  // Variant selected:
  //     variant.price replaces menu_item.price
  //
  // No variant:
  //     menu_item.price is base price
  //
  // Options:
  //     always additional
  // ==========================================================

  const basePrice =
    variantId !== null
      ? variantPrice
      : menuItemPrice;

  const optionTotal =
    pricedOptions.reduce(
      (sum, option) =>
        sum + option.additionalPrice,
      0
    );

  const unitPrice =
    basePrice + optionTotal;

  const lineTotal =
    unitPrice * input.quantity;

  if (
    !Number.isFinite(basePrice) ||
    basePrice < 0
  ) {
    throw new ValidationError(
      'Invalid base price',
      {
        code: 'INVALID_BASE_PRICE',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          menuItemPrice,
          variantId,
          variantCode,
          variantPrice,
          basePrice,
        },
      }
    );
  }

  if (
    !Number.isFinite(optionTotal) ||
    optionTotal < 0
  ) {
    throw new ValidationError(
      'Invalid option total',
      {
        code: 'INVALID_OPTION_TOTAL',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          optionTotal,
        },
      }
    );
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    throw new ValidationError(
      'Invalid item price',
      {
        code: 'INVALID_ITEM_PRICE',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          menuItemPrice,
          variantPrice,
          basePrice,
          optionTotal,
          unitPrice,
        },
      }
    );
  }

  if (
    !Number.isFinite(lineTotal) ||
    lineTotal < 0
  ) {
    throw new ValidationError(
      'Invalid item total',
      {
        code: 'INVALID_ITEM_TOTAL',

        item: {
          menuItemId: menuItem.id,
          name: foodNameSnapshot,
        },

        details: {
          basePrice,
          optionTotal,
          unitPrice,
          quantity: input.quantity,
          lineTotal,
        },
      }
    );
  }

  // ==========================================================
  // LOG
  // ==========================================================

  console.log(
    '[Checkout] PRICE ITEM RESULT',
    {
      menuItemId:
        input.menuItemId,

      menuItemPrice,

      variantId,

      variantCode,

      variantNameSnapshot,

      variantNameJaSnapshot,

      variantPrice,

      pricingMode:
        variantId !== null
          ? 'VARIANT_REPLACES_BASE_PRICE'
          : 'MENU_ITEM_BASE_PRICE',

      basePrice,

      optionTotal,

      unitPrice,

      quantity:
        input.quantity,

      lineTotal,

      options:
        pricedOptions.map(
          (option) => ({
            id:
              option.menuOptionItemId,

            code:
              option.optionCode,

            name:
              option.optionNameSnapshot,

            nameJa:
              option.optionNameJaSnapshot,

            price:
              option.additionalPrice,
          })
        ),
    }
  );

  return {
    input,

    menuItemId:
      menuItem.id,

    foodNameSnapshot,

    foodNameJaSnapshot,

    imageSnapshot:
      menuItem.image_url,

    basePrice,

    // ========================================================
    // KEEP VARIANT SNAPSHOT
    // ========================================================

    variantCode,

    variantNameSnapshot,

    variantNameJaSnapshot,

    options:
      pricedOptions,

    optionTotal,

    lineTotal,
  };
}

// ============================================================
// CREATE ORDER + ITEMS
// ============================================================

async function createOrderAndItemsInShortTx(
  tx: Prisma.TransactionClient,
  input: NormalizedCheckoutInput,
  pricedItems: PricedOrderItem[],
  providedToken?: string | null
) {
  // ==========================================================
  // TOTAL
  // ==========================================================

  const subtotal =
    pricedItems.reduce(
      (sum, item) =>
        sum + item.lineTotal,
      0
    );

  const discount = 0;
  const tax = 0;

  const total =
    subtotal - discount + tax;

  if (
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    throw new Error(
      'Invalid subtotal calculated'
    );
  }

  if (
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new Error(
      'Invalid total calculated'
    );
  }

  // ==========================================================
  // ORDER NUMBER
  // ==========================================================

  const orderNumber =
    await getNextOrderNumber(
      tx,
      input.storeId
    );

  // ==========================================================
  // ORDER TOKEN
  // ==========================================================

  const orderToken =
    providedToken &&
    providedToken.trim().length > 0
      ? providedToken.trim()
      : createOrderToken();

  // ==========================================================
  // CREATE ORDER
  // ==========================================================

  const order =
    await tx.tbl_customer_orders.create({
      data: {
        order_token:
          orderToken,

        order_number:
          orderNumber,

        store_id:
          input.storeId,

        customer_name:
          input.customer.name,

        customer_phone:
          input.customer.phone,

        customer_email:
          input.customer.email,

        customer_locale:
          normalizeLocale(
            input.locale
          ),

        order_type:
          input.orderType,

        scheduled_for:
          input.scheduledTime,

        subtotal:
          new Prisma.Decimal(
            subtotal
          ),

        discount_amount:
          new Prisma.Decimal(
            discount
          ),

        tax_amount:
          new Prisma.Decimal(
            tax
          ),

        total_amount:
          new Prisma.Decimal(
            total
          ),

        currency:
          DEFAULT_CURRENCY,

        status:
          'WAITING_PAYMENT',
      },
    });

  // ==========================================================
  // CREATE ORDER ITEMS
  // ==========================================================

  for (const item of pricedItems) {
    // --------------------------------------------------------
    // IMPORTANT
    //
    // variant_code_snap
    // variant_name_snap
    // variant_name_ja_snap
    //
    // are now persisted here.
    // --------------------------------------------------------

    const orderItem =
      await tx.tbl_customer_order_items.create({
        data: {
          order_id:
            order.id,

          menu_item_id:
            item.menuItemId,

          food_name_snap:
            item.foodNameSnapshot,

          food_name_ja_snap:
            item.foodNameJaSnapshot,

          // ==================================================
          // VARIANT / SIZE SNAPSHOT
          // ==================================================

          variant_code_snap:
            item.variantCode,

          variant_name_snap:
            item.variantNameSnapshot,

          variant_name_ja_snap:
            item.variantNameJaSnapshot,

          // ==================================================
          // ITEM
          // ==================================================

          quantity:
            item.input.quantity,

          price_at_time:
            new Prisma.Decimal(
              item.basePrice
            ),

          discount_amount:
            new Prisma.Decimal(0),

          note:
            item.input.note,

          image_snap:
            item.imageSnapshot,

          option_total:
            new Prisma.Decimal(
              item.optionTotal
            ),
        },
      });

    // ========================================================
    // CREATE OPTIONS / TOPPINGS
    // ========================================================

    if (item.options.length > 0) {
      const optionRows =
        item.options.map(
          (option) => ({
            order_item_id:
              orderItem.id,

            option_item_id:
              option.menuOptionItemId,

            group_name_snap:
              option.groupNameSnapshot,

            group_name_ja_snap:
              option.groupNameJaSnapshot,

            option_name_snap:
              option.optionNameSnapshot,

            option_name_ja_snap:
              option.optionNameJaSnapshot,

            price_snap:
              new Prisma.Decimal(
                option.additionalPrice
              ),
          })
        );

      await tx.tbl_customer_order_item_options.createMany(
        {
          data: optionRows,
        }
      );
    }

    // ========================================================
    // DEBUG
    // ========================================================

    console.log(
      '[Checkout] ORDER ITEM CREATED',
      {
        orderItemId:
          orderItem.id,

        menuItemId:
          item.menuItemId,

        foodName:
          item.foodNameSnapshot,

        // IMPORTANT:
        // This proves size/variant is being persisted.
        variantCode:
          item.variantCode,

        variantName:
          item.variantNameSnapshot,

        variantNameJa:
          item.variantNameJaSnapshot,

        quantity:
          item.input.quantity,

        basePrice:
          item.basePrice,

        optionTotal:
          item.optionTotal,

        lineTotal:
          item.lineTotal,

        optionCount:
          item.options.length,
      }
    );
  }

  return {
    order,

    orderNumber,

    subtotal,

    discount,

    tax,

    total,
  };
}

// ============================================================
// FIND EXISTING ORDER
// ============================================================

async function findExistingOrder(
  input: NormalizedCheckoutInput
) {
  if (input.orderId) {
    const order =
      await orderRepository.findOrderById(
        BigInt(input.orderId)
      );

    if (!order) {
      throw new ValidationError(
        'Order not found',
        {
          code: 'ORDER_NOT_FOUND',
        }
      );
    }

    return order;
  }

  if (
    input.orderToken &&
    input.orderToken.trim().length > 0
  ) {
    return db.tbl_customer_orders.findUnique({
      where: {
        order_token:
          input.orderToken.trim(),
      },
    });
  }

  return null;
}

// ============================================================
// BUILD ORDER CONTEXT
// ============================================================

function buildOrderContext(order: {
  id: bigint;

  order_token: string;

  order_number:
    | number
    | bigint
    | null;

  total_amount: unknown;

  currency: string | null;

  status: string | null;
}) {
  if (
    order.order_number === null ||
    order.order_number === undefined
  ) {
    throw new ValidationError(
      'Order does not have an order number',
      {
        code: 'ORDER_NUMBER_MISSING',
      }
    );
  }

  return {
    id:
      order.id,

    orderToken:
      order.order_token,

    orderNumber:
      Number(
        order.order_number
      ),

    totalAmount:
      toNumber(
        order.total_amount
      ),

    currency:
      (
        order.currency ??
        DEFAULT_CURRENCY
      ).toLowerCase(),

    status:
      order.status ?? null,
  };
}

// ============================================================
// PAYMENT CONTEXT
// ============================================================

function buildPaymentContext(payment: {
  id: bigint;

  status:
    | string
    | null;

  transaction_id:
    | string
    | null;

  client_secret:
    | string
    | null;

  amount: unknown;

  currency:
    | string
    | null;
}) {
  return {
    id:
      payment.id,

    status:
      payment.status ?? null,

    transactionId:
      payment.transaction_id ??
      null,

    clientSecret:
      payment.client_secret ??
      null,

    amount:
      toNumber(
        payment.amount
      ),

    currency:
      (
        payment.currency ??
        DEFAULT_CURRENCY
      ).toLowerCase(),
  };
}

// ============================================================
// MAIN CHECKOUT PREPARATION
// ============================================================

export async function prepareCheckoutPayment(
  input: NormalizedCheckoutInput
): Promise<CheckoutOrderPaymentContext> {
  console.log(
    '[Checkout] Preparing payment',
    {
      locale:
        input.locale,

      storeId:
        input.storeId,

      orderId:
        input.orderId,

      hasOrderToken:
        Boolean(
          input.orderToken
        ),

      itemCount:
        input.items?.length ??
        0,
    }
  );

  // ==========================================================
  // VALIDATE STORE
  // ==========================================================

  const store =
    await orderRepository.findStore(
      input.storeId
    );

  if (!store) {
    throw new ValidationError(
      'Store not found',
      {
        code:
          'STORE_NOT_FOUND',
      }
    );
  }

  // ==========================================================
  // EXISTING ORDER
  // ==========================================================

  const existingOrder =
    await findExistingOrder(
      input
    );

  if (existingOrder) {
    if (
      existingOrder.store_id !==
      input.storeId
    ) {
      throw new ValidationError(
        'Order does not belong to this store',
        {
          code:
            'ORDER_STORE_MISMATCH',
        }
      );
    }

    if (
      existingOrder.status ===
      'PAID'
    ) {
      throw new ValidationError(
        'Order is already paid',
        {
          code:
            'ORDER_ALREADY_PAID',
        }
      );
    }

    const order =
      buildOrderContext(
        existingOrder
      );

    const latestPayment =
      await paymentRepository.findLatestPaymentForOrder(
        existingOrder.id
      );

    // ========================================================
    // PAYMENT SUCCESS
    // ========================================================

    if (
      latestPayment &&
      latestPayment.status ===
        'SUCCESS'
    ) {
      throw new ValidationError(
        'Payment already successful',
        {
          code:
            'PAYMENT_ALREADY_SUCCESS',
        }
      );
    }

    // ========================================================
    // REUSE PENDING PAYMENT
    // ========================================================

    if (
      latestPayment &&
      latestPayment.status ===
        'PENDING'
    ) {
      return {
        order,

        payment:
          buildPaymentContext(
            latestPayment
          ),

        shouldCreatePaymentIntent:
          !latestPayment.transaction_id,

        createdNewPayment:
          false,
      };
    }

    // ========================================================
    // CREATE NEW PAYMENT
    // ========================================================

    const payment =
      await db.$transaction(
        (tx) =>
          paymentRepository.createPendingPayment(
            tx,
            {
              orderId:
                existingOrder.id,

              amount:
                existingOrder.total_amount,

              currency:
                existingOrder.currency ??
                DEFAULT_CURRENCY,

              paymentMethod:
                input.paymentMethod,
            }
          ),
        PAYMENT_TRANSACTION_OPTIONS
      );

    return {
      order,

      payment:
        buildPaymentContext(
          payment
        ),

      shouldCreatePaymentIntent:
        true,

      createdNewPayment:
        true,
    };
  }

  // ==========================================================
  // NEW ORDER
  // ==========================================================

  if (
    !input.items ||
    input.items.length === 0
  ) {
    throw new ValidationError(
      'Cart is empty',
      {
        code:
          'EMPTY_CART',
      }
    );
  }

  // ==========================================================
  // PRICE OUTSIDE TRANSACTION
  // ==========================================================

  const pricedItems =
    await Promise.all(
      input.items.map(
        (item) =>
          priceItem(
            input.storeId,
            item,
            input.locale
          )
      )
    );

  if (
    pricedItems.length === 0
  ) {
    throw new ValidationError(
      'Cart is empty',
      {
        code:
          'EMPTY_CART',
      }
    );
  }

  // ==========================================================
  // SERVER PRICING LOG
  // ==========================================================

  const serverSubtotal =
    pricedItems.reduce(
      (sum, item) =>
        sum + item.lineTotal,
      0
    );

  console.log(
    '[Checkout] SERVER PRICING SUBTOTAL',
    {
      subtotal:
        serverSubtotal,

      items:
        pricedItems.map(
          (item) => ({
            menuItemId:
              item.menuItemId,

            variantCode:
              item.variantCode,

            variantName:
              item.variantNameSnapshot,

            variantNameJa:
              item.variantNameJaSnapshot,

            lineTotal:
              item.lineTotal,

            basePrice:
              item.basePrice,

            optionTotal:
              item.optionTotal,

            quantity:
              item.input.quantity,

            options:
              item.options.map(
                (option) => ({
                  id:
                    option.menuOptionItemId,

                  code:
                    option.optionCode,

                  name:
                    option.optionNameSnapshot,

                  nameJa:
                    option.optionNameJaSnapshot,

                  price:
                    option.additionalPrice,
                })
              ),
          })
        ),
    }
  );

  // ==========================================================
  // CREATE ORDER + ITEMS
  // ==========================================================

  const {
    order,
    orderNumber,
    total,
  } =
    await db.$transaction(
      (tx) =>
        createOrderAndItemsInShortTx(
          tx,
          input,
          pricedItems,
          input.orderToken
        ),

      ORDER_TRANSACTION_OPTIONS
    );

  // ==========================================================
  // CREATE PAYMENT RECORD
  // ==========================================================

  const payment =
    await paymentRepository.createPendingPayment(
      undefined,
      {
        orderId:
          order.id,

        amount:
          new Prisma.Decimal(
            total
          ),

        currency:
          DEFAULT_CURRENCY,

        paymentMethod:
          input.paymentMethod,
      }
    );

  // ==========================================================
  // RESULT
  // ==========================================================

  return {
    order: {
      id:
        order.id,

      orderToken:
        order.order_token,

      orderNumber,

      totalAmount:
        total,

      currency:
        DEFAULT_CURRENCY.toLowerCase(),

      status:
        order.status ?? null,
    },

    payment:
      buildPaymentContext(
        payment
      ),

    shouldCreatePaymentIntent:
      true,

    createdNewPayment:
      true,
  };
}

// ============================================================
// ORDER STATUS
// ============================================================

export async function getOrderStatusByToken(
  orderToken: string
) {
  return orderRepository.findOrderSummaryByToken(
    orderToken
  );
}