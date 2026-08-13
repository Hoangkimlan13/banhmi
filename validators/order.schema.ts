export type CheckoutOrderType =
  | 'IMMEDIATE'
  | 'SCHEDULED_TIME'
  | 'SCHEDULED_DATE';

export type CheckoutLocale =
  | 'ja'
  | 'vi'
  | 'en'
  | 'zh';

export interface CheckoutCustomerInput {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
}

export interface CheckoutCartItemInput {
  id?: unknown;
  itemId?: unknown;
  menuItemId?: unknown;
  quantity?: unknown;
  note?: unknown;
  selectedOptions?: unknown;
  variantId?: unknown;
  variantCode?: unknown;
}

export interface CheckoutInput {
  storeId?: unknown;
  orderId?: unknown;

  // Ngôn ngữ khách đang sử dụng
  locale?: unknown;

  orderType?: unknown;
  scheduledTime?: unknown;

  customer?: CheckoutCustomerInput;

  paymentMethod?: unknown;
  items?: unknown;
  orderToken?: unknown;
}

export interface NormalizedCheckoutItem {
  menuItemId: number;
  quantity: number;
  note: string;
  selectedOptionIds: number[];
  variantId: number | null;
  variantCode: string | null;
}

export interface NormalizedCheckoutInput {
  storeId: number;

  orderId: number | null;

  orderToken: string | null;

  // Ngôn ngữ khách sử dụng khi đặt hàng
  locale: CheckoutLocale;

  orderType: CheckoutOrderType;

  scheduledTime: Date | null;

  customer: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };

  paymentMethod: string;

  items: NormalizedCheckoutItem[];
}

export class ValidationError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function toPositiveInteger(
  value: unknown,
  fieldName: string
) {
  const numberValue = Number(value);

  if (
    !Number.isInteger(numberValue) ||
    numberValue <= 0
  ) {
    throw new ValidationError(
      `${fieldName} is invalid`
    );
  }

  return numberValue;
}

function normalizeSelectedOptionIds(
  selectedOptions: unknown
) {
  if (
    !selectedOptions ||
    typeof selectedOptions !== 'object'
  ) {
    return [];
  }

  const optionIds = Object.values(
    selectedOptions as Record<string, unknown>
  )
    .flatMap((value) =>
      Array.isArray(value)
        ? value
        : [value]
    )
    .map((value) => {
      if (
        !value ||
        typeof value !== 'object'
      ) {
        return null;
      }

      const id = Number(
        (value as { id?: unknown }).id
      );

      return Number.isInteger(id) && id > 0
        ? id
        : null;
    })
    .filter(
      (id): id is number =>
        id !== null
    );

  return Array.from(
    new Set(optionIds)
  );
}

export function parseCheckoutInput(
  body: CheckoutInput
): NormalizedCheckoutInput {

  // =====================================================
  // 1. STORE
  // =====================================================

  const storeId = toPositiveInteger(
    body.storeId,
    'storeId'
  );


  // =====================================================
  // 2. ORDER ID
  // =====================================================

  const orderIdRaw = body.orderId;

  const orderId =
    orderIdRaw === undefined ||
    orderIdRaw === null ||
    orderIdRaw === ''
      ? null
      : toPositiveInteger(
          orderIdRaw,
          'orderId'
        );


  // =====================================================
  // 3. LOCALE
  // =====================================================

  const localeRaw = body.locale;

  const locale: CheckoutLocale =
    localeRaw === 'ja' ||
    localeRaw === 'vi' ||
    localeRaw === 'en' ||
    localeRaw === 'zh'
      ? localeRaw
      : 'ja';


  // =====================================================
  // 4. ORDER TYPE
  // =====================================================

  const orderType =
    String(
      body.orderType || 'IMMEDIATE'
    ) as CheckoutOrderType;

  if (
    ![
      'IMMEDIATE',
      'SCHEDULED_TIME',
      'SCHEDULED_DATE',
    ].includes(orderType)
  ) {
    throw new ValidationError(
      'orderType is invalid'
    );
  }


  // =====================================================
  // 5. CUSTOMER
  // =====================================================

  const customer =
    body.customer || {};

  const isImmediate =
    orderType === 'IMMEDIATE';


  // Nếu IMMEDIATE:
  // Không bắt buộc tên + phone

  const name = isImmediate
    ? null
    : (
        typeof customer.name === 'string' &&
        customer.name.trim()
          ? customer.name.trim()
          : null
      );


  const phone = isImmediate
    ? null
    : (
        typeof customer.phone === 'string' &&
        customer.phone.trim()
          ? customer.phone.trim()
          : null
      );


  const email =
    typeof customer.email === 'string' &&
    customer.email.trim()
      ? customer.email.trim()
      : null;


  // =====================================================
  // 6. VALIDATE CUSTOMER
  // =====================================================

  if (!isImmediate) {

    if (!name) {
      throw new ValidationError(
        'customer.name is required'
      );
    }

    if (!phone) {
      throw new ValidationError(
        'customer.phone is required'
      );
    }
  }


  // =====================================================
  // 7. SCHEDULED TIME
  // =====================================================

  let scheduledTime: Date | null = null;

  if (
    typeof body.scheduledTime === 'string' &&
    body.scheduledTime.trim()
  ) {

    scheduledTime = new Date(
      body.scheduledTime
    );

    if (
      Number.isNaN(
        scheduledTime.getTime()
      )
    ) {
      throw new ValidationError(
        'scheduledTime is invalid'
      );
    }
  }


  if (
    !isImmediate &&
    !scheduledTime
  ) {
    throw new ValidationError(
      'scheduledTime is required'
    );
  }


  if (
    scheduledTime &&
    !isImmediate &&
    scheduledTime.getTime() <
      Date.now()
  ) {
    throw new ValidationError(
      'scheduledTime must be in the future'
    );
  }


  // =====================================================
  // 8. CART
  // =====================================================

  if (
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    throw new ValidationError(
      'Cart is empty'
    );
  }


  // =====================================================
  // 9. NORMALIZE ITEMS
  // =====================================================

  const items =
    body.items.map(
      (rawItem, index) => {

        const item =
          rawItem as CheckoutCartItemInput;


        const menuItemId =
          toPositiveInteger(
            item.menuItemId ??
              item.itemId ??
              item.id,
            `items[${index}].itemId`
          );


        const quantity =
          toPositiveInteger(
            item.quantity,
            `items[${index}].quantity`
          );


        const note =
          typeof item.note === 'string'
            ? item.note
                .trim()
                .slice(0, 255)
            : '';


        const variantId =
          item.variantId
            ? toPositiveInteger(
                item.variantId,
                `items[${index}].variantId`
              )
            : null;


        const variantCode =
          typeof item.variantCode === 'string' &&
          item.variantCode.trim()
            ? item.variantCode.trim()
            : null;


        return {
          menuItemId,

          quantity,

          note,

          selectedOptionIds:
            normalizeSelectedOptionIds(
              item.selectedOptions
            ),

          variantId,

          variantCode,
        };
      }
    );


  // =====================================================
  // 10. ORDER TOKEN
  // =====================================================

  const orderToken =
    typeof body.orderToken === 'string' &&
    body.orderToken.trim()
      ? body.orderToken.trim()
      : null;


  if (
    orderToken &&
    !/^[a-f0-9]{64}$/i.test(
      orderToken
    )
  ) {
    throw new ValidationError(
      'orderToken is invalid'
    );
  }


  // =====================================================
  // 11. RETURN NORMALIZED INPUT
  // =====================================================

  return {
    storeId,

    orderId,

    orderToken,

    // QUAN TRỌNG
    locale,

    orderType,

    scheduledTime,

    customer: {
      name,
      phone,
      email,
    },

    paymentMethod:
      typeof body.paymentMethod === 'string'
        ? body.paymentMethod
        : 'stripe',

    items,

  };
}