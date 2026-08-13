/**
 * Quản lý giỏ hàng trên localStorage
 * - Tự động kiểm tra thời hạn lưu trữ (mặc định 7 ngày).
 * - Tự động dọn dẹp (clear) dữ liệu cũ nếu hết hạn.
 */

const CART_STORAGE_KEY = 'user_shopping_cart';
const CART_EXPIRY_DAYS = 7; // Thời gian lưu tối đa tính bằng ngày

/**
 * Lấy danh sách giỏ hàng từ localStorage.
 * Có kiểm tra điều kiện thời gian hết hạn (7 ngày).
 * Trả về mảng giỏ hàng hoặc mảng rỗng nếu hết hạn / lỗi.
 */
export const getInitialCart = (): any[] => {
  // Đảm bảo chỉ chạy ở môi trường Client (tránh lỗi SSR của Next.js)
  if (typeof window === 'undefined') return [];

  try {
    const savedData = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedData) return [];

    const { cart, timestamp } = JSON.parse(savedData);
    const now = new Date().getTime();
    const expiryTime = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // Quy đổi số ngày ra milliseconds

    // Kiểm tra nếu thời gian hiện tại vượt quá 7 ngày kể từ lúc lưu
    if (now - timestamp > expiryTime) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    return cart || [];
  } catch (error) {
    console.error("Lỗi khi đọc giỏ hàng từ localStorage:", error);
    return [];
  }
};

/**
 * Lưu giỏ hàng kèm theo timestamp hiện tại vào localStorage.
 */
export const saveCartToStorage = (cart: any[]): void => {
  if (typeof window === 'undefined') return;

  try {
    const dataToSave = {
      cart,
      timestamp: new Date().getTime(), // Ghi nhận mốc thời gian lưu mới nhất
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng vào localStorage:", error);
  }
};

/**
 * Xóa sạch giỏ hàng khỏi localStorage (Dùng khi thanh toán xong hoặc cần reset).
 */
export const clearCartStorage = (): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('[Cart] Failed to clear cart:', error);
  }
};