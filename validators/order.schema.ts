// ============================================================
// ORDER / CHECKOUT SCHEMA
// ============================================================
// Responsibility:
// - Validate + normalize dữ liệu từ frontend
// - KHÔNG tin giá tiền từ client
// - KHÔNG query database
// - KHÔNG gọi Stripe
// - Chuẩn hóa locale
// - Chuẩn hóa customer
// - Chuẩn hóa scheduled time theo Asia/Tokyo
// - Chuẩn hóa cart items
// - Tạo lỗi có cấu trúc để frontend dịch đúng ngôn ngữ
// ============================================================

// ============================================================
// TYPES
// ============================================================

export type CheckoutOrderType = 'IMMEDIATE' | 'SCHEDULED_TIME' | 'SCHEDULED_DATE';

export type CheckoutLocale = 'ja' | 'vi' | 'en' | 'zh';

export type CheckoutPaymentMethod = 'stripe';

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
  selectedOptionIds?: unknown; // 👈 THÊM DÒNG NÀY
  variantId?: unknown;
  variantCode?: unknown;
}

export interface CheckoutInput {
  storeId?: unknown;
  orderId?: unknown;
  locale?: unknown; // Ngôn ngữ khách đang sử dụng
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
  locale: CheckoutLocale;
  orderType: CheckoutOrderType;
  scheduledTime: Date | null;
  customer: {
    name: string | null;
    phone: string | null;
    email: string | null;
  };
  paymentMethod: CheckoutPaymentMethod;
  items: NormalizedCheckoutItem[];
}

export interface ValidationErrorItem {
  menuItemId?: number;
  name?: string;
}

export interface ValidationErrorDetails {
  groupName?: string;
  optionName?: string;
  [key: string]: unknown;
}

// ============================================================
// STRUCTURED VALIDATION ERROR
// ============================================================
//
// Frontend KHÔNG nên hiển thị trực tiếp message này.
// Frontend nên dùng: error.code, error.item, error.details
// để dịch sang: ja / vi / en / zh

export class ValidationError extends Error {
  readonly status = 400;
  readonly code: string;
  readonly item?: ValidationErrorItem;
  readonly details?: ValidationErrorDetails;

  constructor(
    message: string,
    options?: {
      code?: string;
      item?: ValidationErrorItem;
      details?: ValidationErrorDetails;
    }
  ) {
    super(message);

    this.name = 'ValidationError';

    this.code = options?.code ?? 'INVALID_CHECKOUT_REQUEST';

    this.item = options?.item;
    this.details = options?.details;

    // Quan trọng: đảm bảo prototype đúng khi kế thừa Error
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ============================================================
// CONSTANTS
// ============================================================

const MAX_QUANTITY_PER_ITEM = 99;
const MAX_CART_ITEMS = 50;
const MAX_NOTE_LENGTH = 255;
const MAX_VARIANT_CODE_LENGTH = 100;
const MAX_ORDER_TOKEN_LENGTH = 64;
const MAX_CUSTOMER_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 50;

// ============================================================
// HELPERS
// ============================================================

function toPositiveInteger(value: unknown, fieldName: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new ValidationError(`${fieldName} is invalid`, {
      code: 'INVALID_NUMBER',
      details: { field: fieldName },
    });
  }

  return numberValue;
}

// ============================================================
// LOCALE
// ============================================================

function normalizeLocale(value: unknown): CheckoutLocale {
  switch (value) {
    case 'ja':
      return 'ja';
    case 'vi':
      return 'vi';
    case 'en':
      return 'en';
    case 'zh':
      return 'zh';
    default:
      return 'ja';
  }
}

// ============================================================
// ORDER TYPE
// ============================================================

function normalizeOrderType(value: unknown): CheckoutOrderType {
  const orderType = String(value || 'IMMEDIATE') as CheckoutOrderType;

  if (!['IMMEDIATE', 'SCHEDULED_TIME', 'SCHEDULED_DATE'].includes(orderType)) {
    throw new ValidationError('orderType is invalid', {
      code: 'INVALID_ORDER_TYPE',
      details: { value: orderType },
    });
  }

  return orderType;
}

// ============================================================
// PAYMENT METHOD
// ============================================================

function normalizePaymentMethod(value: unknown): CheckoutPaymentMethod {
  const paymentMethod = typeof value === 'string' ? value.trim().toLowerCase() : 'stripe';

  if (paymentMethod !== 'stripe') {
    throw new ValidationError('Unsupported payment method', {
      code: 'UNSUPPORTED_PAYMENT_METHOD',
      details: { paymentMethod },
    });
  }

  return 'stripe';
}

// ============================================================
// SELECTED OPTIONS
// ============================================================

function normalizeSelectedOptionIds(selectedOptions: unknown): number[] {
  if (!selectedOptions || typeof selectedOptions !== 'object' || Array.isArray(selectedOptions)) {
    return [];
  }

  const optionIds = Object.values(selectedOptions as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (!value || typeof value !== 'object') return null;
      const id = Number((value as { id?: unknown }).id);
      return Number.isInteger(id) && id > 0 ? id : null;
    })
    .filter((id): id is number => id !== null);

  return Array.from(new Set(optionIds));
}

// ============================================================
// CUSTOMER STRING NORMALIZATION
// ============================================================

function normalizeOptionalString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

// ============================================================
// EMAIL
// ============================================================

function normalizeEmail(value: unknown): string | null {
  const email = normalizeOptionalString(value, MAX_EMAIL_LENGTH);
  if (!email) return null;

  // Kiểm tra định dạng email cơ bản
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new ValidationError('customer.email is invalid', {
      code: 'INVALID_CUSTOMER_EMAIL',
    });
  }

  return email;
}

// ============================================================
// PHONE
// ============================================================

function normalizePhone(value: unknown): string | null {
  const phone = normalizeOptionalString(value, MAX_PHONE_LENGTH);
  if (!phone) return null;

  // Loại bỏ khoảng trắng, dấu gạch ngang, dấu ngoặc đơn
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Kiểm tra định dạng số điện thoại Nhật Bản:
  // - 0 + 9-10 chữ số (ví dụ: 09012345678)
  // - +81 + 10-11 chữ số (ví dụ: +819012345678)
  const phonePattern = /^(0\d{9,10}|\+81\d{10,11})$/;

  if (!phonePattern.test(cleaned)) {
    throw new ValidationError('customer.phone is invalid', {
      code: 'INVALID_CUSTOMER_PHONE',
      details: { phone },
    });
  }

  return phone;
}

// ============================================================
// JAPAN DATETIME
// ============================================================

function parseJapanDateTime(value: string): Date {
  const normalized = value.trim();

  // Nếu đã có timezone, giữ nguyên
  if (/[+-]\d{2}:\d{2}$|Z$/.test(normalized)) {
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError('scheduledTime is invalid', {
        code: 'INVALID_SCHEDULED_TIME',
      });
    }
    return date;
  }

  // Thêm +09:00 nếu chưa có timezone
  const japanDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00+09:00`
    : normalized;

  const date = new Date(japanDateTime);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('scheduledTime is invalid', {
      code: 'INVALID_SCHEDULED_TIME',
    });
  }

  return date;
}

// ============================================================
// SCHEDULED TIME
// ============================================================

function normalizeScheduledTime(orderType: CheckoutOrderType, value: unknown): Date | null {
  const raw = typeof value === 'string' ? value.trim() : '';
  const isImmediate = orderType === 'IMMEDIATE';

  // ----------------------------------------------------------
  // IMMEDIATE
  // ----------------------------------------------------------

  if (isImmediate) {
    if (!raw) return null;

    // Nếu frontend gửi estimated pickup thì vẫn parse được
    try {
      return parseJapanDateTime(raw);
    } catch {
      // IMMEDIATE không bắt buộc scheduledTime
      // Nếu giá trị phụ này sai, bỏ qua thay vì chặn checkout
      return null;
    }
  }

  // ----------------------------------------------------------
  // SCHEDULED
  // ----------------------------------------------------------

  if (!raw) {
    throw new ValidationError('scheduledTime is required', {
      code: 'SCHEDULED_TIME_REQUIRED',
    });
  }

  const scheduledTime = parseJapanDateTime(raw);

  // Không cho đặt quá khứ
  if (scheduledTime.getTime() <= Date.now()) {
    throw new ValidationError('scheduledTime must be in the future', {
      code: 'SCHEDULED_TIME_IN_PAST',
    });
  }

  return scheduledTime;
}

// ============================================================
// ITEM NORMALIZATION
// ============================================================

function normalizeCartItem(rawItem: unknown, index: number): NormalizedCheckoutItem {
  if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
    throw new ValidationError(`items[${index}] is invalid`, {
      code: 'INVALID_CART_ITEM',
      details: { index },
    });
  }

  const item = rawItem as CheckoutCartItemInput;

  // ----------------------------------------------------------
  // MENU ITEM ID
  // ----------------------------------------------------------

  const menuItemId = toPositiveInteger(
    item.menuItemId ?? item.itemId ?? item.id,
    `items[${index}].itemId`
  );

  // ----------------------------------------------------------
  // QUANTITY
  // ----------------------------------------------------------

  const quantity = toPositiveInteger(item.quantity, `items[${index}].quantity`);

  if (quantity > MAX_QUANTITY_PER_ITEM) {
    throw new ValidationError(`items[${index}].quantity is too large`, {
      code: 'QUANTITY_TOO_LARGE',
      item: { menuItemId },
      details: { maxQuantity: MAX_QUANTITY_PER_ITEM },
    });
  }

  // ----------------------------------------------------------
  // NOTE
  // ----------------------------------------------------------

  const note = typeof item.note === 'string' ? item.note.trim().slice(0, MAX_NOTE_LENGTH) : '';

  // ----------------------------------------------------------
  // VARIANT ID
  // ----------------------------------------------------------

  const variantId =
    item.variantId !== undefined && item.variantId !== null && item.variantId !== ''
      ? toPositiveInteger(item.variantId, `items[${index}].variantId`)
      : null;

  // ----------------------------------------------------------
  // VARIANT CODE
  // ----------------------------------------------------------

  let variantCode: string | null = null;
  if (typeof item.variantCode === 'string') {
    const value = item.variantCode.trim();
    if (value) {
      variantCode = value.slice(0, MAX_VARIANT_CODE_LENGTH);
    }
  }

  // ----------------------------------------------------------
  // SELECTED OPTIONS — SỬA PHẦN NÀY
  // ----------------------------------------------------------
  let selectedOptionIds: number[] = [];

  // Ưu tiên lấy từ selectedOptionIds nếu có (frontend mới gửi)
  if (Array.isArray((item as any).selectedOptionIds)) {
    selectedOptionIds = (item as any).selectedOptionIds
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isInteger(id) && id > 0);
  } 
  // Fallback sang selectedOptions (cho các request cũ)
  else if (item.selectedOptions) {
    selectedOptionIds = normalizeSelectedOptionIds(item.selectedOptions);
  }

  return {
    menuItemId,
    quantity,
    note,
    selectedOptionIds,
    variantId,
    variantCode,
  };
}

// ============================================================
// ORDER TOKEN
// ============================================================

function normalizeOrderToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const token = value.trim();
  if (!token) return null;

  if (token.length > MAX_ORDER_TOKEN_LENGTH) {
    throw new ValidationError('orderToken is invalid', {
      code: 'INVALID_ORDER_TOKEN',
    });
  }

  // orderToken được tạo bởi: crypto.randomBytes(32).toString('hex') => 64 hex characters
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new ValidationError('orderToken is invalid', {
      code: 'INVALID_ORDER_TOKEN',
    });
  }

  return token;
}

// ============================================================
// MAIN PARSER
// ============================================================

export function parseCheckoutInput(body: CheckoutInput): NormalizedCheckoutInput {
  // ==========================================================
  // SAFETY
  // ==========================================================

  if (!body || typeof body !== 'object') {
    throw new ValidationError('Invalid checkout request', {
      code: 'INVALID_CHECKOUT_REQUEST',
    });
  }

  // ==========================================================
  // 1. STORE
  // ==========================================================

  const storeId = toPositiveInteger(body.storeId, 'storeId');

  // ==========================================================
  // 2. ORDER ID
  // ==========================================================

  const orderIdRaw = body.orderId;
  const orderId =
    orderIdRaw === undefined || orderIdRaw === null || orderIdRaw === ''
      ? null
      : toPositiveInteger(orderIdRaw, 'orderId');

  // ==========================================================
  // 3. ORDER TOKEN
  // ==========================================================

  const orderToken = normalizeOrderToken(body.orderToken);

  // ==========================================================
  // 4. LOCALE
  // ==========================================================

  const locale = normalizeLocale(body.locale);

  // ==========================================================
  // 5. ORDER TYPE
  // ==========================================================

  const orderType = normalizeOrderType(body.orderType);

  // ==========================================================
  // 6. CUSTOMER
  // ==========================================================

  const customer = body.customer && typeof body.customer === 'object' ? body.customer : {};

  const isImmediate = orderType === 'IMMEDIATE';

  const name = isImmediate ? null : normalizeOptionalString(customer.name, MAX_CUSTOMER_NAME_LENGTH);

  const phone = isImmediate ? null : normalizePhone(customer.phone);

  const email = normalizeEmail(customer.email);

  // ==========================================================
  // 7. CUSTOMER VALIDATION
  // ==========================================================

  if (!isImmediate) {
    if (!name) {
      throw new ValidationError('customer.name is required', {
        code: 'CUSTOMER_NAME_REQUIRED',
      });
    }

    if (!phone) {
      throw new ValidationError('customer.phone is required', {
        code: 'CUSTOMER_PHONE_REQUIRED',
      });
    }
  }

  // ==========================================================
  // 8. SCHEDULED TIME
  // ==========================================================

  const scheduledTime = normalizeScheduledTime(orderType, body.scheduledTime);

  // ==========================================================
  // 9. CART
  // ==========================================================

  if (!Array.isArray(body.items)) {
    throw new ValidationError('Cart is invalid', {
      code: 'INVALID_CART',
    });
  }

  if (body.items.length === 0) {
    throw new ValidationError('Cart is empty', {
      code: 'EMPTY_CART',
    });
  }

  if (body.items.length > MAX_CART_ITEMS) {
    throw new ValidationError('Cart contains too many items', {
      code: 'CART_TOO_LARGE',
      details: { maxItems: MAX_CART_ITEMS },
    });
  }

  // ==========================================================
  // 10. NORMALIZE ITEMS
  // ==========================================================

  const items = body.items.map((rawItem, index) => normalizeCartItem(rawItem, index));

  // ==========================================================
  // 11. PAYMENT METHOD
  // ==========================================================

  const paymentMethod = normalizePaymentMethod(body.paymentMethod);

  // ==========================================================
  // 12. RETURN
  // ==========================================================

  return {
    storeId,
    orderId,
    orderToken,
    locale,
    orderType,
    scheduledTime,
    customer: {
      name,
      phone,
      email,
    },
    paymentMethod,
    items,
  };
}