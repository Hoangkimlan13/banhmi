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

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

interface PricedOrderOption {
  menuOptionItemId: number;
  optionItemTemplateId: number;

  groupCode: string;

  // Tên theo ngôn ngữ khách đặt
  groupNameSnapshot: string;

  // Tên tiếng Nhật dành cho printer
  groupNameJaSnapshot: string;

  optionCode: string;

  // Tên theo ngôn ngữ khách đặt
  optionNameSnapshot: string;

  // Tên tiếng Nhật dành cho printer
  optionNameJaSnapshot: string;

  additionalPrice: number;
}

interface PricedOrderItem {
  input: NormalizedCheckoutItem;

  menuItemId: number;

  // Snapshot theo ngôn ngữ khách đặt
  foodNameSnapshot: string;

  // Snapshot tiếng Nhật dành cho printer
  foodNameJaSnapshot: string;

  imageSnapshot: string | null;

  // Giá món + variant
  basePrice: number;

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

/**
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const DEFAULT_CURRENCY = 'JPY';

const MIN_ORDER_NUMBER = 300;
const MAX_ORDER_NUMBER = 999;

/**
 * ============================================================
 * BASIC HELPERS
 * ============================================================
 */

function createOrderToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Convert Prisma Decimal / bigint / number safely.
 *
 * Không âm thầm biến NaN thành 0.
 * Nếu DB trả dữ liệu không hợp lệ -> throw.
 */
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
    result = (
      value as {
        toNumber: () => number;
      }
    ).toNumber();
  } else {
    result = Number(
      typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'bigint'
        ? value
        : String(value)
    );
  }

  if (!Number.isFinite(result)) {
    throw new Error(`Invalid numeric database value: ${String(value)}`);
  }

  return result;
}

/**
 * ============================================================
 * LOCALE
 * ============================================================
 */

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

/**
 * Lấy tên theo locale khách đang sử dụng.
 *
 * Fallback:
 * current locale
 * -> Japanese
 * -> English
 * -> Vietnamese
 * -> Chinese
 */
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

/**
 * Lấy tên option group theo locale.
 */
function getLocalizedGroupName(
  obj: {
    display_name_ja?: string | null;
    display_name_vi?: string | null;
    display_name_en?: string | null;
    display_name_zh?: string | null;
  },
  locale: string
): string | null {
  const currentLocale = normalizeLocale(locale);

  const names: Record<
    SupportedLocale,
    string | null | undefined
  > = {
    ja: obj.display_name_ja,
    vi: obj.display_name_vi,
    en: obj.display_name_en,
    zh: obj.display_name_zh,
  };

  return (
    names[currentLocale] ??
    obj.display_name_ja ??
    obj.display_name_en ??
    obj.display_name_vi ??
    obj.display_name_zh ??
    null
  );
}

/**
 * ============================================================
 * JAPAN DATE
 * ============================================================
 *
 * 注文番号 reset theo:
 *
 * store_id + Asia/Tokyo date
 *
 * Không dùng UTC date.
 */
function getJapanDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * ============================================================
 * ORDER NUMBER
 * ============================================================
 *
 * IMPORTANT:
 *
 * Bảng:
 *
 * tbl_daily_order_numbers
 *
 * phải có UNIQUE:
 *
 * (store_id, order_date)
 *
 * Logic:
 *
 * first order:
 *   300
 *
 * next:
 *   301
 *   302
 *   ...
 *
 * Transaction giữ lock chỉ trong thời gian cực ngắn.
 */
async function getNextOrderNumber(
  tx: Prisma.TransactionClient,
  storeId: number
): Promise<number> {
  const orderDate = getJapanDateString();

  await tx.$executeRaw`
    INSERT INTO tbl_daily_order_numbers
      (
        store_id,
        order_date,
        last_number
      )
    VALUES
      (
        ${storeId},
        ${orderDate},
        ${MIN_ORDER_NUMBER}
      )
    ON DUPLICATE KEY UPDATE
      last_number = last_number + 1
  `;

  const rows = await tx.$queryRaw<
    Array<{
      last_number: number | bigint;
    }>
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

/**
 * ============================================================
 * PRICE ONE ITEM
 * ============================================================
 *
 * IMPORTANT:
 *
 * Hàm này KHÔNG chạy trong transaction.
 *
 * Đây là phần quan trọng nhất để tránh:
 *
 * "A query cannot be executed on an expired transaction."
 *
 * Tất cả:
 *
 * - menu
 * - variant
 * - option groups
 * - options
 * - variant option prices
 *
 * được đọc trước transaction.
 */
async function priceItem(
  storeId: number,
  input: NormalizedCheckoutItem,
  locale: string
): Promise<PricedOrderItem> {
  /**
   * ----------------------------------------------------------
   * Basic quantity validation
   * ----------------------------------------------------------
   */

  if (
    !Number.isInteger(input.quantity) ||
    input.quantity <= 0
  ) {
    throw new ValidationError(
      'Invalid item quantity',
      {
        code: 'INVALID_QUANTITY',

        item: {
          menuItemId: input.menuItemId,
          name: 'Item',
        },

        details: {
          quantity: input.quantity,
        },
      }
    );
  }

  /**
   * ----------------------------------------------------------
   * MENU ITEM
   * ----------------------------------------------------------
   */

  const menuItem =
    await db.tbl_menu_item.findFirst({
      where: {
        id: input.menuItemId,
        store_id: storeId,
        is_available: true,
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
    getLocalizedName(
      menuItem,
      locale
    ) ??
    menuItem.name_ja ??
    menuItem.name_en ??
    menuItem.name_vi ??
    menuItem.name_zh ??
    'Item';

  const foodNameJaSnapshot =
    menuItem.name_ja ??
    foodNameSnapshot;

  /**
   * ----------------------------------------------------------
   * OPTION GROUPS
   * ----------------------------------------------------------
   */

  const groups =
    await db.tbl_menu_item_option_groups.findMany({
      where: {
        menu_item_id: menuItem.id,
        is_available: true,
      },

      include: {
        tbl_option_group_templates: true,
      },
    });

  /**
   * ----------------------------------------------------------
   * VARIANT
   * ----------------------------------------------------------
   */

  let variantId: number | null =
    input.variantId ?? null;

  let variantCode: string | null =
    input.variantCode ?? null;

  let variantNameSnapshot: string | null =
    null;

  let variantNameJaSnapshot: string | null =
    null;

  let variantPrice = 0;

  if (variantId !== null || variantCode !== null) {
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
            variantCode,
            variantId,
          },
        }
      );
    }

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
  }

  /**
   * ----------------------------------------------------------
   * SELECTED OPTIONS
   * ----------------------------------------------------------
   */

  const selectedOptionIds =
    Array.from(
      new Set(
        input.selectedOptionIds
      )
    );

  const groupIds =
    groups.map(
      (group) => group.id
    );

  const selectedOptions =
    selectedOptionIds.length > 0
      ? await db.tbl_menu_item_option_items.findMany(
          {
            where: {
              id: {
                in: selectedOptionIds,
              },

              is_available: true,

              menu_option_group_id: {
                in: groupIds,
              },
            },

            include: {
              tbl_menu_item_option_groups: {
                include: {
                  tbl_option_group_templates: true,
                },
              },

              tbl_option_item_templates: true,

              tbl_variant_option_prices:
                variantId !== null
                  ? {
                      where: {
                        variant_id:
                          variantId,

                        is_available:
                          true,
                      },
                    }
                  : false,
            },
          }
        )
      : [];

  /**
   * ----------------------------------------------------------
   * VERIFY ALL OPTION IDS
   * ----------------------------------------------------------
   */

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
        },
      }
    );
  }

  /**
   * ----------------------------------------------------------
   * OPTION GROUP RULES
   * ----------------------------------------------------------
   */

  for (const group of groups) {
    const template =
      group.tbl_option_group_templates;

    const selectedForGroup =
      selectedOptions.filter(
        (option) =>
          option.menu_option_group_id ===
          group.id
      );

    const groupName =
      getLocalizedGroupName(
        group,
        locale
      ) ??
      (template
        ? getLocalizedName(
            template,
            locale
          )
        : null) ??
      group.display_name_ja ??
      template?.name_ja ??
      'Option';

    /**
     * Required
     */
    if (
      template?.is_required &&
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
            groupCode:
              template.code,

            groupName,
          },
        }
      );
    }

    /**
     * Maximum choices
     */
    if (
      template?.max_choices !== null &&
      template?.max_choices !== undefined &&
      selectedForGroup.length >
        template.max_choices
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
            groupCode:
              template.code,

            groupName,

            maxChoices:
              template.max_choices,

            selectedCount:
              selectedForGroup.length,
          },
        }
      );
    }

    /**
     * Minimum choices
     *
     * Nếu schema/template của bạn sau này có:
     *
     * min_choices
     *
     * thì bổ sung ở đây.
     */
  }

  /**
   * ----------------------------------------------------------
   * PRICE OPTIONS
   * ----------------------------------------------------------
   */

  const pricedOptions: PricedOrderOption[] =
    selectedOptions.map(
      (option) => {
        const group =
          option.tbl_menu_item_option_groups;

        const groupTemplate =
          group.tbl_option_group_templates;

        const optionTemplate =
          option.option_item_template_id
            ? option.tbl_option_item_templates
            : null;

        const variantPrices =
          variantId !== null &&
          Array.isArray(
            option.tbl_variant_option_prices
          )
            ? option.tbl_variant_option_prices
            : [];

        const variantOverride =
          variantPrices.length > 0
            ? variantPrices[0]
            : null;

        const additionalPrice =
          toNumber(
            variantOverride?.additional_price ??
              option.additional_price
          );

        const groupNameSnapshot =
          getLocalizedGroupName(
            group,
            locale
          ) ??
          (groupTemplate
            ? getLocalizedName(
                groupTemplate,
                locale
              )
            : null) ??
          group.display_name_ja ??
          groupTemplate?.name_ja ??
          '';

        const groupNameJaSnapshot =
          group.display_name_ja ??
          groupTemplate?.name_ja ??
          '';

        const optionNameSnapshot =
          optionTemplate
            ? getLocalizedName(
                optionTemplate,
                locale
              ) ?? ''
            : '';

        const optionNameJaSnapshot =
          optionTemplate?.name_ja ??
          '';

        return {
          menuOptionItemId:
            option.id,

          optionItemTemplateId:
            option.option_item_template_id,

          groupCode:
            groupTemplate?.code ??
            '',

          groupNameSnapshot,

          groupNameJaSnapshot,

          optionCode:
            optionTemplate?.code ??
            '',

          optionNameSnapshot,

          optionNameJaSnapshot,

          additionalPrice,
        };
      }
    );

  /**
   * ----------------------------------------------------------
   * FINAL PRICE
   * ----------------------------------------------------------
   */

  const basePrice =
    toNumber(menuItem.price);

  const optionTotal =
    pricedOptions.reduce(
      (
        sum,
        option
      ) =>
        sum +
        option.additionalPrice,
      0
    );

  const unitPrice =
    basePrice +
    variantPrice +
    optionTotal;

  const lineTotal =
    unitPrice *
    input.quantity;

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
      }
    );
  }

  /**
   * ----------------------------------------------------------
   * SNAPSHOT
   * ----------------------------------------------------------
   */

  return {
    input,

    menuItemId:
      menuItem.id,

    foodNameSnapshot,

    foodNameJaSnapshot,

    imageSnapshot:
      menuItem.image_url,

    basePrice:
      basePrice +
      variantPrice,

    variantCode,

    variantNameSnapshot,

    variantNameJaSnapshot,

    options:
      pricedOptions,

    optionTotal,

    lineTotal,
  };
}

/**
 * ============================================================
 * CREATE ORDER + ITEMS
 * ============================================================
 *
 * IMPORTANT:
 *
 * Hàm này chạy trong transaction.
 *
 * Tuyệt đối KHÔNG:
 *
 * - query menu
 * - query option
 * - gọi Stripe
 * - gọi HTTP API
 * - gọi external service
 *
 * Chỉ INSERT/atomic DB operation.
 */
async function createOrderAndItemsInShortTx(
  tx: Prisma.TransactionClient,

  input: NormalizedCheckoutInput,

  pricedItems: PricedOrderItem[],

  providedToken?: string | null
) {
  /**
   * ----------------------------------------------------------
   * TOTAL
   * ----------------------------------------------------------
   */

  const subtotal =
    pricedItems.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.lineTotal,
      0
    );

  const discount = 0;

  const tax = 0;

  const total =
    subtotal -
    discount +
    tax;

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

  /**
   * ----------------------------------------------------------
   * ORDER NUMBER
   * ----------------------------------------------------------
   */

  const orderNumber =
    await getNextOrderNumber(
      tx,
      input.storeId
    );

  /**
   * ----------------------------------------------------------
   * ORDER
   * ----------------------------------------------------------
   */

  const order =
    await tx.tbl_customer_orders.create({
      data: {
        order_token:
          providedToken ||
          createOrderToken(),

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

  /**
   * ----------------------------------------------------------
   * ORDER ITEMS
   * ----------------------------------------------------------
   */

  for (const item of pricedItems) {
    const orderItem =
      await tx.tbl_customer_order_items.create(
        {
          data: {
            order_id:
              order.id,

            menu_item_id:
              item.menuItemId,

            /**
             * Customer language
             */
            food_name_snap:
              item.foodNameSnapshot,

            /**
             * Japanese printer snapshot
             */
            food_name_ja_snap:
              item.foodNameJaSnapshot,

            quantity:
              item.input.quantity,

            /**
             * Base + variant.
             *
             * Option total lưu riêng.
             */
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
        }
      );

    /**
     * --------------------------------------------------------
     * OPTIONS
     * --------------------------------------------------------
     *
     * createMany:
     *
     * 1 query thay vì N queries.
     */
    if (
      item.options.length > 0
    ) {
      const optionRows =
        item.options.map(
          (option) => ({
            order_item_id:
              orderItem.id,

            option_item_id:
              option.menuOptionItemId,

            group_name_snap:
              option.groupNameSnapshot,

            option_name_snap:
              option.optionNameSnapshot,

            group_name_ja_snap:
              option.groupNameJaSnapshot,

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
          data:
            optionRows,
        }
      );
    }
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

/**
 * ============================================================
 * FIND EXISTING ORDER
 * ============================================================
 */
async function findExistingOrder(
  input: NormalizedCheckoutInput
) {
  /**
   * orderId ưu tiên.
   */
  if (input.orderId) {
    const order =
      await orderRepository.findOrderById(
        BigInt(input.orderId)
      );

    if (!order) {
      throw new ValidationError(
        'Order not found',
        {
          code:
            'ORDER_NOT_FOUND',
        }
      );
    }

    return order;
  }

  /**
   * Fallback orderToken.
   */
  if (input.orderToken) {
    return db.tbl_customer_orders.findUnique(
      {
        where: {
          order_token:
            input.orderToken,
        },
      }
    );
  }

  return null;
}

/**
 * ============================================================
 * BUILD ORDER CONTEXT
 * ============================================================
 */
function buildOrderContext(
  order: {
    id: bigint;
    order_token: string;
    order_number: number | bigint | null;
    total_amount: unknown;
    currency: string | null;
    status: string | null;
  }
) {
  if (
    order.order_number ===
      null ||
    order.order_number ===
      undefined
  ) {
    throw new ValidationError(
      'Order does not have an order number',
      {
        code:
          'ORDER_NUMBER_MISSING',
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
      order.status ??
      null,
  };
}

/**
 * ============================================================
 * MAIN CHECKOUT PREPARATION
 * ============================================================
 *
 * Flow:
 *
 * 1. Validate store
 * 2. Check existing order
 * 3. Existing order:
 *      reuse pending payment
 *      OR create payment record
 *
 * 4. New order:
 *      price/validate OUTSIDE transaction
 *      short transaction
 *      create payment record
 *
 * Stripe PaymentIntent:
 *
 * KHÔNG tạo ở đây.
 *
 * payment.service.ts xử lý Stripe.
 */
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

      orderToken:
        input.orderToken,
    }
  );

  /**
   * ==========================================================
   * 1. STORE
   * ==========================================================
   */

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

  /**
   * ==========================================================
   * 2. EXISTING ORDER
   * ==========================================================
   */

  const existingOrder =
    await findExistingOrder(
      input
    );

  if (existingOrder) {
    /**
     * --------------------------------------------------------
     * Already paid
     * --------------------------------------------------------
     */

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

    /**
     * --------------------------------------------------------
     * Existing order must have order number.
     * --------------------------------------------------------
     */

    const order =
      buildOrderContext(
        existingOrder
      );

    /**
     * --------------------------------------------------------
     * Find latest payment
     * --------------------------------------------------------
     */

    const latestPayment =
      await paymentRepository.findLatestPaymentForOrder(
        existingOrder.id
      );

    /**
     * --------------------------------------------------------
     * Existing pending payment
     *
     * IMPORTANT:
     *
     * Không tạo payment record mới.
     * --------------------------------------------------------
     */

    if (
      latestPayment &&
      latestPayment.status ===
        'PENDING'
    ) {
      return {
        order,

        payment: {
          id:
            latestPayment.id,

          status:
            latestPayment.status ??
            null,

          transactionId:
            latestPayment.transaction_id ??
            null,

          clientSecret:
            latestPayment.client_secret ??
            null,

          amount:
            toNumber(
              latestPayment.amount
            ),

          currency:
            (
              latestPayment.currency ??
              DEFAULT_CURRENCY
            ).toLowerCase(),
        },

        /**
         * PaymentIntent chỉ được tạo nếu
         * payment record chưa có transaction ID.
         */
        shouldCreatePaymentIntent:
          !latestPayment.transaction_id,

        createdNewPayment:
          false,
      };
    }

    /**
     * --------------------------------------------------------
     * Existing order nhưng chưa có pending payment.
     *
     * Transaction cực ngắn:
     * chỉ INSERT payment.
     * --------------------------------------------------------
     */

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
        {
          maxWait:
            3000,

          timeout:
            5000,
        }
      );

    return {
      order,

      payment: {
        id:
          payment.id,

        status:
          payment.status ??
          null,

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
      },

      shouldCreatePaymentIntent:
        true,

      createdNewPayment:
        true,
    };
  }

  /**
   * ==========================================================
   * 3. NEW ORDER
   * ==========================================================
   *
   * IMPORTANT:
   *
   * Toàn bộ pricing/validation nằm NGOÀI transaction.
   *
   * Đây là điểm fix chính cho:
   *
   * "A query cannot be executed on an expired transaction."
   * ==========================================================
   */

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

  /**
   * ----------------------------------------------------------
   * Safety check
   * ----------------------------------------------------------
   */

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

  /**
   * ==========================================================
   * 4. SHORT TRANSACTION
   * ==========================================================
   *
   * Chỉ:
   *
   * - order number
   * - order
   * - order items
   * - options
   *
   * Không query menu.
   * Không Stripe.
   * Không HTTP.
   */

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
      {
        maxWait:
          5000,

        /**
         * 10 seconds là safety net,
         * KHÔNG phải cách chữa transaction chậm.
         *
         * Transaction thực tế phải rất ngắn.
         */
        timeout:
          10000,
      }
    );

  /**
   * ==========================================================
   * 5. CREATE PAYMENT RECORD
   * ==========================================================
   *
   * Tách khỏi transaction order.
   *
   * Stripe chưa được gọi ở đây.
   */

  const payment =
    await db.$transaction(
      (tx) =>
        paymentRepository.createPendingPayment(
          tx,
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
        ),
      {
        maxWait:
          3000,

        timeout:
          5000,
      }
    );

  /**
   * ==========================================================
   * 6. RETURN
   * ==========================================================
   */

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
        order.status ??
        null,
    },

    payment: {
      id:
        payment.id,

      status:
        payment.status ??
        null,

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
    },

    /**
     * payment.service.ts sẽ quyết định
     * có tạo Stripe PaymentIntent hay không.
     */
    shouldCreatePaymentIntent:
      true,

    createdNewPayment:
      true,
  };
}

/**
 * ============================================================
 * ORDER STATUS
 * ============================================================
 */
export async function getOrderStatusByToken(
  orderToken: string
) {
  return orderRepository.findOrderSummaryByToken(
    orderToken
  );
}