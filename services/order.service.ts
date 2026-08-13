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


interface PricedOrderOption {
  menuOptionItemId: number;
  optionItemTemplateId: number;

  groupCode: string;

  // Tên theo ngôn ngữ khách đặt
  groupNameSnapshot: string;

  // Tên tiếng Nhật dành riêng cho printer
  groupNameJaSnapshot: string;

  optionCode: string;

  // Tên theo ngôn ngữ khách đặt
  optionNameSnapshot: string;

  // Tên tiếng Nhật dành riêng cho printer
  optionNameJaSnapshot: string;

  additionalPrice: number;
}


interface PricedOrderItem {
  input: NormalizedCheckoutItem;
  menuItemId: number;

  // Tên theo ngôn ngữ khách đặt
  foodNameSnapshot: string;

  // Tên tiếng Nhật dành riêng cho printer
  foodNameJaSnapshot: string;

  imageSnapshot: string | null;
  basePrice: number;
  variantCode: string | null;

  // Nếu sau này cần variant theo locale
  variantNameSnapshot: string | null;
  variantNameJaSnapshot: string | null;

  options: PricedOrderOption[];
  optionTotal: number;
  lineTotal: number;
}


/**
 * Context dùng xuyên suốt checkout/payment.
 *
 * orderToken:
 *   - mã định danh bảo mật/random
 *   - dùng để tìm order
 *   - lưu localStorage cho lịch sử mua hàng
 *   - KHÔNG hiển thị cho khách
 *
 * orderNumber:
 *   - 注文番号
 *   - số khách nhìn thấy
 *   - 300, 301, 302...
 *   - reset mỗi ngày
 *   - reset riêng theo từng store
 */
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


function createOrderToken() {
  return crypto.randomBytes(32).toString('hex');
}


function toNumber(value: unknown) {
  return Number(value?.toString ? value.toString() : value);
}

type SupportedLocale = 'ja' | 'vi' | 'en' | 'zh';

function normalizeLocale(locale: string): SupportedLocale {
  if (
    locale === 'ja' ||
    locale === 'vi' ||
    locale === 'en' ||
    locale === 'zh'
  ) {
    return locale;
  }

  return 'ja';
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

  const names: Record<SupportedLocale, string | null | undefined> = {
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
 * Lấy ngày hiện tại theo timezone Nhật Bản.
 *
 * Không dùng new Date().toISOString().substring(0, 10)
 * vì ISO có thể đang ở UTC và gây reset số sai ngày tại Nhật.
 */
function getJapanDateString() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}


/**
 * Cấp 注文番号 an toàn khi có nhiều khách đặt cùng lúc.
 *
 * Quy tắc:
 *
 * Store 1 - 2026-08-11:
 *   300
 *   301
 *   302
 *
 * Store 2 - 2026-08-11:
 *   300
 *   301
 *
 * Sang ngày 2026-08-12:
 * Store 1:
 *   300
 *
 * KHÔNG dùng MAX(order_number) + 1.
 *
 * Bảng tbl_daily_order_numbers phải có UNIQUE:
 * (store_id, order_date)
 */
async function getNextOrderNumber(
  tx: Prisma.TransactionClient,
  storeId: number
): Promise<number> {
  const orderDate = getJapanDateString();

  /*
   * Lần đầu trong ngày/store:
   *
   * last_number = 300
   *
   * Nếu record đã tồn tại:
   *
   * last_number = last_number + 1
   *
   * ON DUPLICATE KEY UPDATE được MySQL thực hiện atomic.
   */
  await tx.$executeRaw`
    INSERT INTO tbl_daily_order_numbers
      (store_id, order_date, last_number)
    VALUES
      (${storeId}, ${orderDate}, 300)
    ON DUPLICATE KEY UPDATE
      last_number = last_number + 1
  `;

  /*
   * Vì INSERT/UPDATE nằm trong transaction hiện tại,
   * row counter vừa được lock bởi transaction này.
   */
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

  if (!rows.length) {
    throw new Error(
      `Unable to generate order number for store ${storeId}`
    );
  }

  const orderNumber = Number(rows[0].last_number);

  if (
    !Number.isInteger(orderNumber) ||
    orderNumber < 300 ||
    orderNumber > 999
  ) {
    throw new Error(
      `Invalid order number generated: ${orderNumber}`
    );
  }

  return orderNumber;
}


async function priceItem(
  tx: Prisma.TransactionClient,
  storeId: number,
  input: NormalizedCheckoutItem,
  locale: string
): Promise<PricedOrderItem> {
  const menuItem = await tx.tbl_menu_item.findFirst({
    where: {
      id: input.menuItemId,
      store_id: storeId,
      is_available: true,
    },
  });

  if (!menuItem) {
    throw new ValidationError(
      `Menu item ${input.menuItemId} is invalid or unavailable`
    );
  }

  const groups =
    await tx.tbl_menu_item_option_groups.findMany({
      where: {
        menu_item_id: menuItem.id,
        is_available: true,
      },
      include: {
        tbl_option_group_templates: true,
      },
    });

  let variantId: number | null = input.variantId;
  let variantCode: string | null = input.variantCode;

  let variantNameSnapshot: string | null = null;
  let variantNameJaSnapshot: string | null = null;

  let variantPrice = 0;

  if (variantId || variantCode) {
    const variant =
      await tx.tbl_menu_item_variants.findFirst({
        where: {
          menu_item_id: menuItem.id,
          is_available: true,
          deleted_at: null,
          ...(variantId ? { id: variantId } : {}),
          ...(variantCode ? { code: variantCode } : {}),
        },
      });

    if (!variant) {
      throw new ValidationError(
        `Variant is invalid for menu item ${input.menuItemId}`
      );
    }

    variantId = variant.id;
    variantCode = variant.code;

    variantNameSnapshot =
      getLocalizedName(variant, locale);

    variantNameJaSnapshot =
      variant.name_ja || null;

    variantPrice = toNumber(variant.price);
  }

  const selectedOptionIds = Array.from(
    new Set(input.selectedOptionIds)
  );

  const selectedOptions =
    selectedOptionIds.length > 0
      ? await tx.tbl_menu_item_option_items.findMany({
          where: {
            id: {
              in: selectedOptionIds,
            },
            is_available: true,
            menu_option_group_id: {
              in: groups.map((group) => group.id),
            },
          },

          include: {
            tbl_menu_item_option_groups: {
              include: {
                tbl_option_group_templates: true,
              },
            },

            tbl_option_item_templates: true,

            tbl_variant_option_prices: variantId
              ? {
                  where: {
                    variant_id: variantId,
                    is_available: true,
                  },
                }
              : false,
          },
        })
      : [];

  if (
    selectedOptions.length !==
    selectedOptionIds.length
  ) {
    throw new ValidationError(
      `Selected option is invalid for item ${input.menuItemId}`
    );
  }

  for (const group of groups) {
    const template =
      group.tbl_option_group_templates;

    const selectedForGroup =
      selectedOptions.filter(
        (option) =>
          option.menu_option_group_id === group.id
      );

    if (
      template.is_required &&
      selectedForGroup.length === 0
    ) {
      throw new ValidationError(
        `Required option group ${template.code} is missing`
      );
    }

    if (
      template.max_choices &&
      selectedForGroup.length >
        template.max_choices
    ) {
      throw new ValidationError(
        `Too many options selected for group ${template.code}`
      );
    }
  }

  const pricedOptions = selectedOptions.map(
    (option) => {
      const group =
        option.tbl_menu_item_option_groups;

      const groupTemplate =
        group.tbl_option_group_templates;

      const optionTemplate =
        option.tbl_option_item_templates;

      const variantOverride =
        variantId &&
        option.tbl_variant_option_prices.length > 0
          ? option.tbl_variant_option_prices[0]
          : null;

      const additionalPrice = toNumber(
        variantOverride?.additional_price ??
          option.additional_price
      );

      return {
      menuOptionItemId: option.id,

      optionItemTemplateId:
        option.option_item_template_id,

      groupCode:
        groupTemplate.code,

      // ============================================
      // TÊN NHÓM THEO NGÔN NGỮ KHÁCH
      // ============================================
      groupNameSnapshot:
        getLocalizedGroupName(group, locale) ??
        getLocalizedName(groupTemplate, locale) ??
        group.display_name_ja ??
        groupTemplate.name_ja ??
        '',

      // ============================================
      // TÊN NHÓM TIẾNG NHẬT - PRINTER
      // ============================================
      groupNameJaSnapshot:
        group.display_name_ja ??
        groupTemplate.name_ja ??
        '',

      optionCode:
        optionTemplate.code,

      // ============================================
      // TÊN OPTION THEO NGÔN NGỮ KHÁCH
      // ============================================
      optionNameSnapshot:
        getLocalizedName(optionTemplate, locale) ?? '',

      // ============================================
      // TÊN OPTION TIẾNG NHẬT - PRINTER
      // ============================================
      optionNameJaSnapshot:
        optionTemplate.name_ja ?? '',

      additionalPrice,
    };
    }
  );

  const basePrice = toNumber(menuItem.price);

  const optionTotal =
    pricedOptions.reduce(
      (sum, option) =>
        sum + option.additionalPrice,
      0
    );

  const lineTotal =
    (basePrice +
      variantPrice +
      optionTotal) *
    input.quantity;

  return {
    input,

    menuItemId: menuItem.id,

    // ============================================
    // TÊN THEO NGÔN NGỮ KHÁCH ĐẶT
    // ============================================
    foodNameSnapshot:
      getLocalizedName(menuItem, locale) ?? '',

    // ============================================
    // TÊN TIẾNG NHẬT DÀNH CHO PRINTER
    // ============================================
    foodNameJaSnapshot:
      menuItem.name_ja ?? '',

    imageSnapshot:
      menuItem.image_url,

    basePrice:
      basePrice + variantPrice,

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
 * Tạo order + order items trong CÙNG transaction.
 *
 * order_number được cấp ngay tại đây.
 */
async function createOrderAndItems(
  tx: Prisma.TransactionClient,
  input: NormalizedCheckoutInput,
  providedToken?: string | null
) {
  const pricedItems = await Promise.all(
    input.items.map((item) =>
      priceItem(
        tx,
        input.storeId,
        item,
        input.locale
      )
    )
  );

  const subtotal = pricedItems.reduce(
    (sum, item) =>
      sum + item.lineTotal,
    0
  );

  const discount = 0;
  const tax = 0;

  const total =
    subtotal -
    discount +
    tax;

  /*
   * QUAN TRỌNG:
   *
   * Cấp 注文番号 trước khi create order.
   *
   * Đây là số thực sự lưu vào:
   *
   * tbl_customer_orders.order_number
   */
  const orderNumber =
    await getNextOrderNumber(
      tx,
      input.storeId
    );

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

        // ============================================
        // NGÔN NGỮ KHÁCH ĐẶT HÀNG
        // ============================================
        customer_locale:
          input.locale,

        order_type:
          input.orderType,

        scheduled_for:
          input.scheduledTime,

        subtotal:
          new Prisma.Decimal(subtotal),

        discount_amount:
          new Prisma.Decimal(discount),

        tax_amount:
          new Prisma.Decimal(tax),

        total_amount:
          new Prisma.Decimal(total),

        currency:
          'JPY',

        status:
          'WAITING_PAYMENT',
      },
    });

  for (const item of pricedItems) {
    const orderItem =
    await tx.tbl_customer_order_items.create({
      data: {
        order_id:
          order.id,

        menu_item_id:
          item.menuItemId,

        
        // Tên theo ngôn ngữ khách đặt
        food_name_snap:
          item.foodNameSnapshot,

        // Tên tiếng Nhật dành cho printer
        food_name_ja_snap:
          item.foodNameJaSnapshot,

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

    for (const option of item.options) {

      await tx.tbl_customer_order_item_options.create({
        data: {
          order_item_id:
            orderItem.id,

          option_item_id:
            option.menuOptionItemId,

          // ============================================
          // TÊN OPTION THEO NGÔN NGỮ KHÁCH
          // ============================================
          group_name_snap:
            option.groupNameSnapshot,

          option_name_snap:
            option.optionNameSnapshot,

          // ============================================
          // TÊN TIẾNG NHẬT DÀNH CHO PRINTER
          // ============================================
          group_name_ja_snap:
            option.groupNameJaSnapshot,

          option_name_ja_snap:
            option.optionNameJaSnapshot,

          price_snap:
            new Prisma.Decimal(
              option.additionalPrice
            ),
        },
      });

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
        'Order not found'
      );
    }

    return order;
  }

  if (input.orderToken) {
    return db.tbl_customer_orders.findUnique({
      where: {
        order_token:
          input.orderToken,
      },
    });
  }

  return null;
}


export async function prepareCheckoutPayment(
  input: NormalizedCheckoutInput
): Promise<CheckoutOrderPaymentContext> {
  console.log('[ORDER LOCALE]', {
  locale: input.locale,
  storeId: input.storeId,
  orderId: input.orderId,
  orderToken: input.orderToken,
});

  const store =
    await orderRepository.findStore(
      input.storeId
    );

  if (!store) {
    throw new ValidationError(
      'Store not found'
    );
  }

  const existingOrder =
    await findExistingOrder(input);

  /*
   * =====================================================
   * ORDER ĐÃ TỒN TẠI
   * =====================================================
   */
  if (existingOrder) {
    if (
      existingOrder.status ===
      'PAID'
    ) {
      throw new ValidationError(
        'Order is already paid'
      );
    }

    /*
     * Không cấp order_number mới.
     *
     * Phải giữ nguyên số cũ.
     */
    if (!existingOrder.order_number) {
      throw new ValidationError(
        'Existing order does not have an order number'
      );
    }

    const latestPayment =
      await paymentRepository.findLatestPaymentForOrder(
        existingOrder.id
      );

    if (
      latestPayment &&
      latestPayment.status ===
        'PENDING'
    ) {
      return {
        order: {
          id:
            existingOrder.id,

          orderToken:
            existingOrder.order_token,

          orderNumber:
            Number(
              existingOrder.order_number
            ),

          totalAmount:
            toNumber(
              existingOrder.total_amount
            ),

          currency:
            (
              existingOrder.currency ||
              'JPY'
            ).toLowerCase(),

          status:
            existingOrder.status ||
            null,
        },

        payment: {
          id:
            latestPayment.id,

          status:
            latestPayment.status ||
            null,

          transactionId:
            latestPayment.transaction_id,

          clientSecret:
            latestPayment.client_secret,

          amount:
            toNumber(
              latestPayment.amount
            ),

          currency:
            (
              latestPayment.currency ||
              'JPY'
            ).toLowerCase(),
        },

        shouldCreatePaymentIntent:
          !latestPayment.transaction_id,

        createdNewPayment:
          false,
      };
    }

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
                existingOrder.currency ||
                'JPY',

              paymentMethod:
                input.paymentMethod,
            }
          )
      );

    return {
      order: {
        id:
          existingOrder.id,

        orderToken:
          existingOrder.order_token,

        orderNumber:
          Number(
            existingOrder.order_number
          ),

        totalAmount:
          toNumber(
            existingOrder.total_amount
          ),

        currency:
          (
            existingOrder.currency ||
            'JPY'
          ).toLowerCase(),

        status:
          existingOrder.status ||
          null,
      },

      payment: {
        id:
          payment.id,

        status:
          payment.status ||
          null,

        transactionId:
          payment.transaction_id ||
          null,

        clientSecret:
          payment.client_secret ||
          null,

        amount:
          toNumber(payment.amount),

        currency:
          (
            payment.currency ||
            'JPY'
          ).toLowerCase(),
      },

      shouldCreatePaymentIntent:
        true,

      createdNewPayment:
        true,
    };
  }


  /*
   * =====================================================
   * ORDER MỚI
   * =====================================================
   *
   * order_number được tạo trong transaction.
   */
  const {
    order,
    orderNumber,
    total,
  } = await db.$transaction(
    (tx) =>
      createOrderAndItems(
        tx,
        input,
        input.orderToken
      )
  );


  /*
   * Tạo payment cho order vừa tạo.
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
              new Prisma.Decimal(total),

            currency:
              'JPY',

            paymentMethod:
              input.paymentMethod,
          }
        )
    );


  return {
    order: {
      id:
        order.id,

      orderToken:
        order.order_token,

      /*
       * Đây chính là 注文番号
       */
      orderNumber,

      totalAmount:
        total,

      currency:
        'jpy',

      status:
        order.status ||
        null,
    },

    payment: {
      id:
        payment.id,

      status:
        payment.status ||
        null,

      transactionId:
        payment.transaction_id ||
        null,

      clientSecret:
        payment.client_secret ||
        null,

      amount:
        toNumber(
          payment.amount
        ),

      currency:
        (
          payment.currency ||
          'JPY'
        ).toLowerCase(),
    },

    shouldCreatePaymentIntent:
      true,

    createdNewPayment:
      true,
  };
}


export async function getOrderStatusByToken(
  orderToken: string
) {
  return orderRepository.findOrderSummaryByToken(
    orderToken
  );
}