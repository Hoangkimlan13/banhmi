export interface OrderItemOption {
  id: number;
  order_item_id: number;
  option_item_id?: number | null;

  group_name_snap?: string | null;
  group_name_ja_snap?: string | null;

  option_name_snap: string;
  option_name_ja_snap?: string | null;
  option_name_vi_snap?: string | null;
  option_name_en_snap?: string | null;
  option_name_zh_snap?: string | null;

  price_snap: number | string;

  option_code?: string | null;
  option_group_id?: string | number | null;
  option_group_code?: string | null;
}

export interface OrderItem {
  id: string | number;

  food_name_snap: string;

  quantity: number | string;

  price_at_time: number | string;

  image_snap: string | null;

  note: string | null;

  option_total?: number | string | null;

  // ==========================================
  // VARIANT / SIZE SNAPSHOT
  // ==========================================
  variant_name_snap?: string | null;

  variant_name_ja_snap?: string | null;

  variant_code_snap?: string | null;

  // ==========================================
  // OPTIONS / TOPPINGS
  // ==========================================
  tbl_customer_order_item_options?: OrderItemOption[];
}


export type Locale = 'ja' | 'en' | 'vi' | 'zh';

export interface Order {
  id: string | number;
  order_token: string;
  order_number: string | number | null;

  store_id?: string | number | null;

  status: string | null;

  total_amount: number | string;
  currency: string;

  created_at: string;

  order_type?: string | null;
  scheduled_for?: string | null;

  customer_name?: string | null;
  customer_phone?: string | null;

  tbl_customer_order_items?: OrderItem[];
}

export interface StoredOrder {
  orderToken: string;

  orderId?: string | number | null;
  orderNumber?: string | number | null;

  storeId?: string | number | null;
  storeName?: string | null;

  totalAmount?: number | string | null;
  currency?: string | null;

  createdAt?: string | null;
}

/**
 * Order dùng để hiển thị trên Order History.
 *
 * DB order + thông tin snapshot được lưu trong localStorage.
 */
export interface DisplayOrder extends Order {
  storeName?: string | null;

  localCreatedAt?: string | null;

  store_id?: string | number | null;

  tbl_customer_order_items?: OrderItem[];
}
