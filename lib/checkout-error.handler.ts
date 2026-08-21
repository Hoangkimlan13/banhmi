import { ValidationError } from '@/validators/order.schema';
import { PaymentConfigurationError } from '@/validators/payment.schema';

// ============================================================
// TYPES
// ============================================================

export type SupportedLocale =
  | 'ja'
  | 'vi'
  | 'en'
  | 'zh';

export type ErrorItem = {
  menuItemId?: number;
  name?: string;
};

export type ErrorDetails = {
  groupName?: string;
  optionName?: string;
  [key: string]: unknown;
};

export type ValidationErrorMeta = {
  code?: string;
  item?: ErrorItem | null;
  details?: ErrorDetails | null;
};


// ============================================================
// LOCALE
// ============================================================

export function normalizeLocale(
  locale: unknown
): SupportedLocale {
  switch (locale) {
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
// VALIDATION ERROR META
// ============================================================

export function getValidationMeta(
  error: unknown
): ValidationErrorMeta {
  if (!(error instanceof ValidationError)) {
    return {};
  }

  const validationError =
    error as ValidationError & ValidationErrorMeta;

  return {
    code:
      validationError.code,

    item:
      validationError.item ?? null,

    details:
      validationError.details ?? null,
  };
}


// ============================================================
// ERROR CODE
// ============================================================

export function getErrorCode(
  error: unknown
): string {
  if (error instanceof ValidationError) {
    const meta =
      getValidationMeta(error);

    return (
      meta.code ||
      'INVALID_CHECKOUT_REQUEST'
    );
  }

  if (
    error instanceof PaymentConfigurationError
  ) {
    return 'STRIPE_CONFIG_ERROR';
  }

  return 'CHECKOUT_FAILED';
}


// ============================================================
// ITEM
// ============================================================

export function getItem(
  error: unknown
): ErrorItem | null {
  if (!(error instanceof ValidationError)) {
    return null;
  }

  return (
    getValidationMeta(error).item ??
    null
  );
}


// ============================================================
// DETAILS
// ============================================================

export function getDetails(
  error: unknown
): ErrorDetails | null {
  if (!(error instanceof ValidationError)) {
    return null;
  }

  return (
    getValidationMeta(error).details ??
    null
  );
}


// ============================================================
// LOCALIZED ERROR MESSAGE
// ============================================================

export function getLocalizedErrorMessage(
  code: string,
  locale: SupportedLocale,
  itemName: string | null,
  details: ErrorDetails | null
): string {

  const item =
    itemName?.trim() || null;

  const groupName =
    details?.groupName
      ? String(details.groupName)
      : null;


  switch (code) {

    // ========================================================
    // ITEM UNAVAILABLE
    // ========================================================

    case 'ITEM_UNAVAILABLE':

      switch (locale) {

        case 'ja':
          return item
            ? `「${item}」は現在ご注文いただけません。`
            : '選択した商品は現在ご注文いただけません。';

        case 'vi':
          return item
            ? `Món “${item}” hiện không thể đặt.`
            : 'Sản phẩm bạn chọn hiện không thể đặt.';

        case 'en':
          return item
            ? `“${item}” is currently unavailable.`
            : 'The selected product is currently unavailable.';

        case 'zh':
          return item
            ? `「${item}」目前无法订购。`
            : '您选择的商品目前无法订购。';
      }

      break;


    // ========================================================
    // INVALID VARIANT
    // ========================================================

    case 'INVALID_VARIANT':

      switch (locale) {

        case 'ja':
          return item
            ? `「${item}」の選択内容を確認できませんでした。商品をもう一度選択してください。`
            : '商品の選択内容を確認できませんでした。もう一度お試しください。';

        case 'vi':
          return item
            ? `Không thể xác nhận lựa chọn của món “${item}”. Vui lòng chọn lại món.`
            : 'Không thể xác nhận lựa chọn sản phẩm. Vui lòng thử lại.';

        case 'en':
          return item
            ? `We couldn't verify the selection for “${item}”. Please select the product again.`
            : 'We could not verify the product selection. Please try again.';

        case 'zh':
          return item
            ? `无法确认「${item}」的选择内容。请重新选择该商品。`
            : '无法确认商品的选择内容，请重试。';
      }

      break;


    // ========================================================
    // INVALID OPTION
    // ========================================================

    case 'INVALID_OPTION':

      switch (locale) {

        case 'ja':
          return item
            ? `「${item}」のオプション内容を確認できませんでした。もう一度選択してください。`
            : '商品のオプション内容を確認できませんでした。もう一度お試しください。';

        case 'vi':
          return item
            ? `Không thể xác nhận tùy chọn của món “${item}”. Vui lòng chọn lại tùy chọn.`
            : 'Không thể xác nhận tùy chọn của sản phẩm. Vui lòng thử lại.';

        case 'en':
          return item
            ? `We couldn't verify the options for “${item}”. Please select the options again.`
            : 'We could not verify the product options. Please try again.';

        case 'zh':
          return item
            ? `无法确认「${item}」的选项。请重新选择商品选项。`
            : '无法确认商品选项，请重试。';
      }

      break;


    // ========================================================
    // REQUIRED OPTION
    // ========================================================

    case 'REQUIRED_OPTION_MISSING':

      switch (locale) {

        case 'ja':
          if (item && groupName) {
            return `「${item}」の「${groupName}」を選択してください。`;
          }

          if (groupName) {
            return `「${groupName}」を選択してください。`;
          }

          return '必要なオプションを選択してください。';

        case 'vi':
          if (item && groupName) {
            return `Vui lòng chọn “${groupName}” cho món “${item}”.`;
          }

          if (groupName) {
            return `Vui lòng chọn “${groupName}”.`;
          }

          return 'Vui lòng chọn tùy chọn bắt buộc.';

        case 'en':
          if (item && groupName) {
            return `Please select “${groupName}” for “${item}”.`;
          }

          if (groupName) {
            return `Please select “${groupName}”.`;
          }

          return 'Please select the required option.';

        case 'zh':
          if (item && groupName) {
            return `请选择「${item}」的「${groupName}」。`;
          }

          if (groupName) {
            return `请选择「${groupName}」。`;
          }

          return '请选择必选项。';
      }

      break;


    // ========================================================
    // TOO MANY OPTIONS
    // ========================================================

    case 'TOO_MANY_OPTIONS':

      switch (locale) {

        case 'ja':
          if (item && groupName) {
            return `「${item}」の「${groupName}」で選択できる数を超えています。`;
          }

          if (groupName) {
            return `「${groupName}」の選択数が上限を超えています。`;
          }

          return '選択できるオプション数を超えています。';

        case 'vi':
          if (item && groupName) {
            return `Món “${item}” đã chọn quá số lượng cho phép ở “${groupName}”.`;
          }

          if (groupName) {
            return `Bạn đã chọn quá số lượng cho phép ở “${groupName}”.`;
          }

          return 'Bạn đã chọn quá số lượng tùy chọn cho phép.';

        case 'en':
          if (item && groupName) {
            return `Too many options were selected for “${groupName}” on “${item}”.`;
          }

          if (groupName) {
            return `Too many options were selected for “${groupName}”.`;
          }

          return 'Too many options were selected.';

        case 'zh':
          if (item && groupName) {
            return `「${item}」的「${groupName}」选择数量超过限制。`;
          }

          if (groupName) {
            return `「${groupName}」的选择数量超过限制。`;
          }

          return '选择的选项数量超过限制。';
      }

      break;


    // ========================================================
    // ORDER NOT FOUND
    // ========================================================

    case 'ORDER_NOT_FOUND':

      switch (locale) {

        case 'ja':
          return '注文情報が見つかりません。もう一度お試しください。';

        case 'vi':
          return 'Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.';

        case 'en':
          return 'We could not find your order. Please try again.';

        case 'zh':
          return '找不到订单信息，请重试。';
      }

      break;


    // ========================================================
    // ORDER ALREADY PAID
    // ========================================================

    case 'ORDER_ALREADY_PAID':

      switch (locale) {

        case 'ja':
          return 'この注文はすでにお支払い済みです。';

        case 'vi':
          return 'Đơn hàng này đã được thanh toán.';

        case 'en':
          return 'This order has already been paid.';

        case 'zh':
          return '此订单已经支付。';
      }

      break;


    // ========================================================
    // STORE NOT FOUND
    // ========================================================

    case 'STORE_NOT_FOUND':

      switch (locale) {

        case 'ja':
          return '店舗情報を確認できませんでした。ページを更新してもう一度お試しください。';

        case 'vi':
          return 'Không thể xác nhận thông tin cửa hàng. Vui lòng tải lại trang và thử lại.';

        case 'en':
          return 'We could not verify the store. Please refresh the page and try again.';

        case 'zh':
          return '无法确认店铺信息，请刷新页面后重试。';
      }

      break;


    // ========================================================
    // STRIPE CONFIG
    // ========================================================

    case 'STRIPE_CONFIG_ERROR':

      switch (locale) {

        case 'ja':
          return '決済システムを利用できません。しばらくしてからもう一度お試しください。';

        case 'vi':
          return 'Hệ thống thanh toán hiện không khả dụng. Vui lòng thử lại sau ít phút.';

        case 'en':
          return 'The payment system is currently unavailable. Please try again later.';

        case 'zh':
          return '支付系统目前无法使用，请稍后重试。';
      }

      break;


    // ========================================================
    // STRIPE UNKNOWN
    // ========================================================

    case 'STRIPE_OPERATION_UNKNOWN':

      switch (locale) {

        case 'ja':
          return '決済の状態を確認できませんでした。もう一度お試しください。';

        case 'vi':
          return 'Không thể xác nhận trạng thái thanh toán. Vui lòng thử lại.';

        case 'en':
          return 'We could not confirm the payment status. Please try again.';

        case 'zh':
          return '无法确认支付状态，请重试。';
      }

      break;


    // ========================================================
    // INVALID CHECKOUT
    // ========================================================

    case 'INVALID_CHECKOUT_REQUEST':

      switch (locale) {

        case 'ja':
          return '注文内容を確認できませんでした。もう一度お試しください。';

        case 'vi':
          return 'Không thể xác nhận nội dung đơn hàng. Vui lòng thử lại.';

        case 'en':
          return 'We could not verify your order. Please try again.';

        case 'zh':
          return '无法确认订单内容，请重试。';
      }

      break;


    // ========================================================
    // CHECKOUT FAILED
    // ========================================================

    case 'CHECKOUT_FAILED':
    default:

      switch (locale) {

        case 'ja':
          return '注文を処理できませんでした。しばらくしてからもう一度お試しください。';

        case 'vi':
          return 'Không thể xử lý đơn hàng. Vui lòng thử lại sau ít phút.';

        case 'en':
          return 'We could not process your order. Please try again in a moment.';

        case 'zh':
          return '无法处理订单，请稍后重试。';
      }

      break;
  }

  return (
    locale === 'ja'
      ? '注文を処理できませんでした。'
      : locale === 'vi'
        ? 'Không thể xử lý đơn hàng.'
        : locale === 'zh'
          ? '无法处理订单。'
          : 'We could not process your order.'
  );
}


// ============================================================
// ITEM UNAVAILABLE WITH NAME FROM CART
// ============================================================

/**
 * Tạo thông báo lỗi ITEM_UNAVAILABLE có tên món từ giỏ hàng.
 * Nếu không tìm thấy tên, fallback về thông báo chung.
 */
export function getLocalizedItemUnavailableMessage(
  locale: SupportedLocale,
  menuItemId: number,
  cart: Array<{ menuItemId?: number; id?: number; name?: string; foodNameSnapshot?: string; [key: string]: any }>
): string {
  // Tìm item trong giỏ hàng
  const cartItem = cart.find(
    (item) => Number(item.menuItemId) === menuItemId || Number(item.id) === menuItemId
  );
  const itemName = cartItem?.name || cartItem?.foodNameSnapshot || null;

  // Nếu có tên, hiển thị thông báo cụ thể, ngược lại thông báo chung
  if (itemName) {
    switch (locale) {
      case 'ja':
        return `「${itemName}」は現在ご注文いただけません。`;
      case 'vi':
        return `Món “${itemName}” hiện không thể đặt.`;
      case 'en':
        return `“${itemName}” is currently unavailable.`;
      case 'zh':
        return `「${itemName}」目前无法订购。`;
      default:
        return `“${itemName}” is currently unavailable.`;
    }
  } else {
    // Fallback to generic message
    switch (locale) {
      case 'ja':
        return '選択した商品は現在ご注文いただけません。';
      case 'vi':
        return 'Sản phẩm bạn chọn hiện không thể đặt.';
      case 'en':
        return 'The selected product is currently unavailable.';
      case 'zh':
        return '您选择的商品目前无法订购。';
      default:
        return 'The selected product is currently unavailable.';
    }
  }
}


// ============================================================
// HTTP STATUS
// ============================================================

export function getHttpStatus(
  error: unknown
): number {

  if (
    error instanceof ValidationError
  ) {
    return 400;
  }

  if (
    error instanceof PaymentConfigurationError
  ) {
    return 503;
  }

  return 500;
}