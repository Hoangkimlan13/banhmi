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
  menuOptionItemId: number;      // id trong tbl_menu_option_items
  groupId: number;               // id của tbl_menu_option_groups
  groupCode: string;
  groupNameSnapshot: string;     // tên group theo locale khách
  groupNameJaSnapshot: string;   // tên group tiếng Nhật cho printer
  optionCode: string;
  optionNameSnapshot: string;    // tên option theo locale khách
  optionNameJaSnapshot: string;  // tên option tiếng Nhật cho printer
  additionalPrice: number;
}

interface PricedOrderItem {
  input: NormalizedCheckoutItem;
  menuItemId: number;
  foodNameSnapshot: string;
  foodNameJaSnapshot: string;
  imageSnapshot: string | null;
  basePrice: number;             // giá món + variant (nếu có)
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

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  let result: number;
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    result = (value as any).toNumber();
  } else {
    result = Number(typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' ? value : String(value));
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
 * Lấy tên theo locale từ object có các trường name_ja, name_vi, name_en, name_zh
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
  const names: Record<SupportedLocale, string | null | undefined> = {
    ja: obj.name_ja,
    vi: obj.name_vi,
    en: obj.name_en,
    zh: obj.name_zh,
  };
  return names[currentLocale] ?? obj.name_ja ?? obj.name_en ?? obj.name_vi ?? obj.name_zh ?? null;
}

/**
 * Lấy tên group từ mapping (display_name_*) hoặc từ group info (name_*)
 */
function getGroupDisplayName(
  mapping: { display_name_ja?: string | null; display_name_vi?: string | null; display_name_en?: string | null; display_name_zh?: string | null },
  groupInfo: { name_ja?: string | null; name_vi?: string | null; name_en?: string | null; name_zh?: string | null },
  locale: string
): string {
  const currentLocale = normalizeLocale(locale);
  const names: Record<SupportedLocale, string | null | undefined> = {
    ja: mapping.display_name_ja ?? groupInfo.name_ja,
    vi: mapping.display_name_vi ?? groupInfo.name_vi,
    en: mapping.display_name_en ?? groupInfo.name_en,
    zh: mapping.display_name_zh ?? groupInfo.name_zh,
  };
  return names[currentLocale] ?? mapping.display_name_ja ?? groupInfo.name_ja ?? mapping.display_name_en ?? groupInfo.name_en ?? mapping.display_name_vi ?? groupInfo.name_vi ?? mapping.display_name_zh ?? groupInfo.name_zh ?? 'Option';
}

/**
 * ============================================================
 * JAPAN DATE
 * ============================================================
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
 */

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
  const rows = await tx.$queryRaw<Array<{ last_number: number | bigint }>>`
    SELECT last_number
    FROM tbl_daily_order_numbers
    WHERE store_id = ${storeId}
      AND order_date = ${orderDate}
    FOR UPDATE
  `;
  if (rows.length !== 1) {
    throw new Error(`Unable to generate order number for store ${storeId}`);
  }
  const orderNumber = Number(rows[0].last_number);
  if (!Number.isInteger(orderNumber) || orderNumber < MIN_ORDER_NUMBER || orderNumber > MAX_ORDER_NUMBER) {
    throw new ValidationError(`Daily order number limit exceeded for store ${storeId}`, {
      code: 'ORDER_NUMBER_LIMIT_REACHED',
    });
  }
  return orderNumber;
}

/**
 * ============================================================
 * PRICE ONE ITEM (sửa toàn bộ để dùng schema mới)
 * ============================================================
 *
 * Chạy hoàn toàn ngoài transaction.
 */
async function priceItem(
  storeId: number,
  input: NormalizedCheckoutItem,
  locale: string
): Promise<PricedOrderItem> {
  // ----------------------------------------------------------
  // Quantity validation
  // ----------------------------------------------------------
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new ValidationError('Invalid item quantity', {
      code: 'INVALID_QUANTITY',
      item: { menuItemId: input.menuItemId, name: 'Item' },
      details: { quantity: input.quantity },
    });
  }

  // ----------------------------------------------------------
  // 1. Lấy menu item
  // ----------------------------------------------------------
  const menuItem = await db.tbl_menu_item.findFirst({
    where: {
      id: input.menuItemId,
      // tbl_menu_item không có is_available.
      // Món còn bán được xác định bằng status = ACTIVE.
      status: 'ACTIVE',
      discontinued_at: null,
    },
  });
  if (!menuItem) {
    throw new ValidationError(`Menu item ${input.menuItemId} is invalid or unavailable`, {
      code: 'ITEM_UNAVAILABLE',
      item: { menuItemId: input.menuItemId },
    });
  }

  const foodNameSnapshot = getLocalizedName(menuItem, locale) ?? menuItem.name_ja ?? 'Item';
  const foodNameJaSnapshot = menuItem.name_ja ?? foodNameSnapshot;

  // ----------------------------------------------------------
  // 2. Lấy các option groups mapping cho menu item này
  //    Bao gồm thông tin của group (tbl_menu_option_groups)
  // ----------------------------------------------------------
  const groupsMapping = await db.tbl_menu_item_option_groups.findMany({
    where: {
      menu_item_id: menuItem.id,
      is_available: true,
    },
    include: {
      tbl_menu_option_groups: true, // lấy thông tin group (code, name, ...)
    },
    orderBy: {
      sort_order: 'asc',
    },
  });

  // Tạo map groupId -> mapping + groupInfo
  const groupMap = new Map<
    number,
    {
      mapping: typeof groupsMapping[0];
      groupInfo: typeof groupsMapping[0]['tbl_menu_option_groups'];
    }
  >();
  for (const gm of groupsMapping) {
    groupMap.set(gm.option_group_id, {
      mapping: gm,
      groupInfo: gm.tbl_menu_option_groups,
    });
  }

  // ----------------------------------------------------------
  // 3. Xử lý variant (nếu có)
  // ----------------------------------------------------------
  let variantId: number | null = input.variantId ?? null;
  let variantCode: string | null = input.variantCode ?? null;
  let variantNameSnapshot: string | null = null;
  let variantNameJaSnapshot: string | null = null;
  let variantPrice = 0;

  if (variantId !== null || variantCode !== null) {
    const variant = await db.tbl_menu_item_variants.findFirst({
      where: {
        menu_item_id: menuItem.id,
        is_available: true,
        deleted_at: null,
        ...(variantId !== null ? { id: variantId } : {}),
        ...(variantCode !== null ? { code: variantCode } : {}),
      },
    });
    if (!variant) {
      throw new ValidationError('Selected variant is invalid', {
        code: 'INVALID_VARIANT',
        item: { menuItemId: menuItem.id, name: foodNameSnapshot },
        details: { variantCode, variantId },
      });
    }
    variantId = variant.id;
    variantCode = variant.code;
    variantNameSnapshot = getLocalizedName(variant, locale);
    variantNameJaSnapshot = variant.name_ja ?? null;
    variantPrice = toNumber(variant.price);
  }

  // ----------------------------------------------------------
  // 4. Lấy các option items được chọn
  //    Lọc theo option_group_id thuộc danh sách groupId của menu item
  // ----------------------------------------------------------
  const groupIds = Array.from(groupMap.keys());
  const selectedOptionIds = Array.from(new Set(input.selectedOptionIds ?? []));

  let selectedOptions: Array<{
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
  }> = [];

  if (selectedOptionIds.length > 0 && groupIds.length > 0) {
    selectedOptions = await db.tbl_menu_option_items.findMany({
      where: {
        id: { in: selectedOptionIds },
        is_available: true,
        option_group_id: { in: groupIds },
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

  // Kiểm tra tất cả option ids được chọn đều tồn tại
  if (selectedOptions.length !== selectedOptionIds.length) {
    throw new ValidationError('One or more selected options are invalid', {
      code: 'INVALID_OPTION',
      item: { menuItemId: menuItem.id, name: foodNameSnapshot },
      details: { selectedOptionIds },
    });
  }

  // ----------------------------------------------------------
  // 5. Validate rules cho từng group (required, max_choices)
  //    Dùng thông tin từ mapping (groupMap)
  // ----------------------------------------------------------
  for (const [groupId, { mapping, groupInfo }] of groupMap) {
    const selectedForGroup = selectedOptions.filter((opt) => opt.option_group_id === groupId);
    const groupDisplayName = getGroupDisplayName(mapping, groupInfo, locale);

    // Required
    if (mapping.is_required && selectedForGroup.length === 0) {
      throw new ValidationError('Required option is missing', {
        code: 'REQUIRED_OPTION_MISSING',
        item: { menuItemId: menuItem.id, name: foodNameSnapshot },
        details: {
          groupCode: groupInfo.code,
          groupName: groupDisplayName,
        },
      });
    }

    // max_choices
    const maxChoices = mapping.max_choices ?? null;
    if (maxChoices !== null && selectedForGroup.length > maxChoices) {
      throw new ValidationError('Too many options selected', {
        code: 'TOO_MANY_OPTIONS',
        item: { menuItemId: menuItem.id, name: foodNameSnapshot },
        details: {
          groupCode: groupInfo.code,
          groupName: groupDisplayName,
          maxChoices,
          selectedCount: selectedForGroup.length,
        },
      });
    }
    // Có thể thêm min_choices nếu cần
  }

  // ----------------------------------------------------------
  // 6. Xây dựng pricedOptions
  // ----------------------------------------------------------
  const pricedOptions: PricedOrderOption[] = selectedOptions.map((option) => {
    const groupId = option.option_group_id;
    const { mapping, groupInfo } = groupMap.get(groupId)!;

    const groupDisplayName = getGroupDisplayName(mapping, groupInfo, locale);
    const groupJaName = mapping.display_name_ja ?? groupInfo.name_ja ?? '';

    const optionNameSnapshot = getLocalizedName(option, locale) ?? option.name_ja ?? '';
    const optionNameJaSnapshot = option.name_ja ?? '';

    // Giá của option (không có variant override trong schema mới)
    const additionalPrice = toNumber(option.price);

    return {
      menuOptionItemId: option.id,
      groupId: groupId,
      groupCode: groupInfo.code,
      groupNameSnapshot: groupDisplayName,
      groupNameJaSnapshot: groupJaName,
      optionCode: option.code,
      optionNameSnapshot,
      optionNameJaSnapshot,
      additionalPrice,
    };
  });

  // ----------------------------------------------------------
  // 7. Tính giá
  // ----------------------------------------------------------
  const basePrice = toNumber(menuItem.price) + variantPrice;
  const optionTotal = pricedOptions.reduce((sum, opt) => sum + opt.additionalPrice, 0);
  const unitPrice = basePrice + optionTotal;
  const lineTotal = unitPrice * input.quantity;

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    throw new ValidationError('Invalid item price', {
      code: 'INVALID_ITEM_PRICE',
      item: { menuItemId: menuItem.id, name: foodNameSnapshot },
    });
  }
  if (!Number.isFinite(lineTotal) || lineTotal < 0) {
    throw new ValidationError('Invalid item total', {
      code: 'INVALID_ITEM_TOTAL',
      item: { menuItemId: menuItem.id, name: foodNameSnapshot },
    });
  }

  return {
    input,
    menuItemId: menuItem.id,
    foodNameSnapshot,
    foodNameJaSnapshot,
    imageSnapshot: menuItem.image_url,
    basePrice,
    variantCode,
    variantNameSnapshot,
    variantNameJaSnapshot,
    options: pricedOptions,
    optionTotal,
    lineTotal,
  };
}

/**
 * ============================================================
 * CREATE ORDER + ITEMS (transaction ngắn)
 * ============================================================
 * Chạy trong transaction, chỉ INSERT/UPDATE, không query menu/option.
 */
async function createOrderAndItemsInShortTx(
  tx: Prisma.TransactionClient,
  input: NormalizedCheckoutInput,
  pricedItems: PricedOrderItem[],
  providedToken?: string | null
) {
  // Tính tổng
  const subtotal = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;

  if (!Number.isFinite(subtotal) || subtotal < 0) throw new Error('Invalid subtotal calculated');
  if (!Number.isFinite(total) || total < 0) throw new Error('Invalid total calculated');

  // Order number
  const orderNumber = await getNextOrderNumber(tx, input.storeId);

  // Tạo order
  const order = await tx.tbl_customer_orders.create({
    data: {
      order_token: providedToken || createOrderToken(),
      order_number: orderNumber,
      store_id: input.storeId,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email,
      customer_locale: normalizeLocale(input.locale),
      order_type: input.orderType,
      scheduled_for: input.scheduledTime,
      subtotal: new Prisma.Decimal(subtotal),
      discount_amount: new Prisma.Decimal(discount),
      tax_amount: new Prisma.Decimal(tax),
      total_amount: new Prisma.Decimal(total),
      currency: DEFAULT_CURRENCY,
      status: 'WAITING_PAYMENT',
    },
  });

  // Tạo order items và options
  for (const item of pricedItems) {
    const orderItem = await tx.tbl_customer_order_items.create({
      data: {
        order_id: order.id,
        menu_item_id: item.menuItemId,
        food_name_snap: item.foodNameSnapshot,
        food_name_ja_snap: item.foodNameJaSnapshot,
        quantity: item.input.quantity,
        price_at_time: new Prisma.Decimal(item.basePrice),
        discount_amount: new Prisma.Decimal(0),
        note: item.input.note,
        image_snap: item.imageSnapshot,
        option_total: new Prisma.Decimal(item.optionTotal),
      },
    });

    if (item.options.length > 0) {
      const optionRows = item.options.map((opt) => ({
        order_item_id: orderItem.id,
        option_item_id: opt.menuOptionItemId,
        group_name_snap: opt.groupNameSnapshot,
        group_name_ja_snap: opt.groupNameJaSnapshot,
        option_name_snap: opt.optionNameSnapshot,
        option_name_ja_snap: opt.optionNameJaSnapshot,
        price_snap: new Prisma.Decimal(opt.additionalPrice),
      }));
      await tx.tbl_customer_order_item_options.createMany({ data: optionRows });
    }
  }

  return { order, orderNumber, subtotal, discount, tax, total };
}

/**
 * ============================================================
 * FIND EXISTING ORDER
 * ============================================================
 */
async function findExistingOrder(input: NormalizedCheckoutInput) {
  if (input.orderId) {
    const order = await orderRepository.findOrderById(BigInt(input.orderId));
    if (!order) throw new ValidationError('Order not found', { code: 'ORDER_NOT_FOUND' });
    return order;
  }
  if (input.orderToken) {
    return db.tbl_customer_orders.findUnique({ where: { order_token: input.orderToken } });
  }
  return null;
}

/**
 * ============================================================
 * BUILD ORDER CONTEXT
 * ============================================================
 */
function buildOrderContext(order: {
  id: bigint;
  order_token: string;
  order_number: number | bigint | null;
  total_amount: unknown;
  currency: string | null;
  status: string | null;
}) {
  if (order.order_number === null || order.order_number === undefined) {
    throw new ValidationError('Order does not have an order number', { code: 'ORDER_NUMBER_MISSING' });
  }
  return {
    id: order.id,
    orderToken: order.order_token,
    orderNumber: Number(order.order_number),
    totalAmount: toNumber(order.total_amount),
    currency: (order.currency ?? DEFAULT_CURRENCY).toLowerCase(),
    status: order.status ?? null,
  };
}

/**
 * ============================================================
 * MAIN CHECKOUT PREPARATION
 * ============================================================
 */
export async function prepareCheckoutPayment(
  input: NormalizedCheckoutInput
): Promise<CheckoutOrderPaymentContext> {
  console.log('[Checkout] Preparing payment', {
    locale: input.locale,
    storeId: input.storeId,
    orderId: input.orderId,
    orderToken: input.orderToken,
  });

  // ----------------------------------------------------------
  // 1. Kiểm tra store
  // ----------------------------------------------------------
  const store = await orderRepository.findStore(input.storeId);
  if (!store) {
    throw new ValidationError('Store not found', { code: 'STORE_NOT_FOUND' });
  }

  // ----------------------------------------------------------
  // 2. Kiểm tra order đã tồn tại?
  // ----------------------------------------------------------
  const existingOrder = await findExistingOrder(input);
  if (existingOrder) {
    // Nếu order đã PAID
    if (existingOrder.status === 'PAID') {
      throw new ValidationError('Order is already paid', { code: 'ORDER_ALREADY_PAID' });
    }

    const order = buildOrderContext(existingOrder);
    const latestPayment = await paymentRepository.findLatestPaymentForOrder(existingOrder.id);

    // Nếu có pending payment
    if (latestPayment && latestPayment.status === 'PENDING') {
      return {
        order,
        payment: {
          id: latestPayment.id,
          status: latestPayment.status ?? null,
          transactionId: latestPayment.transaction_id ?? null,
          clientSecret: latestPayment.client_secret ?? null,
          amount: toNumber(latestPayment.amount),
          currency: (latestPayment.currency ?? DEFAULT_CURRENCY).toLowerCase(),
        },
        shouldCreatePaymentIntent: !latestPayment.transaction_id,
        createdNewPayment: false,
      };
    }

    // Tạo payment mới cho order cũ
    const payment = await db.$transaction(
      (tx) =>
        paymentRepository.createPendingPayment(tx, {
          orderId: existingOrder.id,
          amount: existingOrder.total_amount,
          currency: existingOrder.currency ?? DEFAULT_CURRENCY,
          paymentMethod: input.paymentMethod,
        }),
      { maxWait: 3000, timeout: 5000 }
    );

    return {
      order,
      payment: {
        id: payment.id,
        status: payment.status ?? null,
        transactionId: payment.transaction_id ?? null,
        clientSecret: payment.client_secret ?? null,
        amount: toNumber(payment.amount),
        currency: (payment.currency ?? DEFAULT_CURRENCY).toLowerCase(),
      },
      shouldCreatePaymentIntent: true,
      createdNewPayment: true,
    };
  }

  // ----------------------------------------------------------
  // 3. Order mới: pricing OUTSIDE transaction
  // ----------------------------------------------------------
  const pricedItems = await Promise.all(
    input.items.map((item) => priceItem(input.storeId, item, input.locale))
  );

  if (pricedItems.length === 0) {
    throw new ValidationError('Cart is empty', { code: 'EMPTY_CART' });
  }

  // ----------------------------------------------------------
  // 4. Short transaction: chỉ INSERT order + items
  // ----------------------------------------------------------
  const { order, orderNumber, total } = await db.$transaction(
    (tx) => createOrderAndItemsInShortTx(tx, input, pricedItems, input.orderToken),
    { maxWait: 5000, timeout: 10000 }
  );

  // ----------------------------------------------------------
  // 5. Tạo payment record (ngoài transaction order)
  // ----------------------------------------------------------
  const payment = await db.$transaction(
    (tx) =>
      paymentRepository.createPendingPayment(tx, {
        orderId: order.id,
        amount: new Prisma.Decimal(total),
        currency: DEFAULT_CURRENCY,
        paymentMethod: input.paymentMethod,
      }),
    { maxWait: 3000, timeout: 5000 }
  );

  return {
    order: {
      id: order.id,
      orderToken: order.order_token,
      orderNumber,
      totalAmount: total,
      currency: DEFAULT_CURRENCY.toLowerCase(),
      status: order.status ?? null,
    },
    payment: {
      id: payment.id,
      status: payment.status ?? null,
      transactionId: payment.transaction_id ?? null,
      clientSecret: payment.client_secret ?? null,
      amount: toNumber(payment.amount),
      currency: (payment.currency ?? DEFAULT_CURRENCY).toLowerCase(),
    },
    shouldCreatePaymentIntent: true,
    createdNewPayment: true,
  };
}

/**
 * ============================================================
 * ORDER STATUS
 * ============================================================
 */
export async function getOrderStatusByToken(orderToken: string) {
  return orderRepository.findOrderSummaryByToken(orderToken);
}