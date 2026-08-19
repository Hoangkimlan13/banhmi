export interface ReservationItemOption {
  id: number | string;
  group_name_snap?: string | null;
  group_name_ja_snap?: string | null;
  option_name_snap?: string | null;
  option_name_ja_snap?: string | null;
  price_snap?: number | null;
}

export interface ReservationItem {
  id: number | string;
  quantity: number;
  price_at_time?: number | null;
  food_name_snap?: string | null;
  food_name_ja_snap?: string | null;
  note?: string | null;
  tbl_customer_order_item_options?: ReservationItemOption[];
}

export interface Reservation {
  id: number;
  order_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  scheduled_for: string | Date | null;
  status: string;
  total_amount: number;
  cancel_reason: string | null;
  created_at: string | Date | null;
  order_type: string;
  // Thêm thuộc tính này để fix lỗi gạch chân đỏ khi gọi danh sách món ăn
  tbl_customer_order_items?: ReservationItem[];
}

export type ReservationStatus =
  | "WAITING_PAYMENT"
  | "PAID"
  | "CANCELLED"
  | "COMPLETED"
  | "PAYMENT_FAILED";