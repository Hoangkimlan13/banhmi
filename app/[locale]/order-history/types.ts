export interface StoredOrder {
  orderToken: string;
  orderId?: string;
  orderNumber?: number | null;
  storeId?: number | string | null;
  storeName?: string | null;
  totalAmount?: number | string | null;
  currency?: string | null;
  createdAt?: string | null;
}

export interface OrderItemOption {
  id: number;
  order_item_id: number;
  option_item_id?: number | null;
  group_name_snap?: string | null;
  option_name_snap: string;
  price_snap: number | string;
  option_code?: string | null;
  option_name_ja?: string | null;
  option_name_vi?: string | null;
  option_name_en?: string | null;
  option_name_zh?: string | null;
  option_group_id?: string | number | null;
  option_group_code?: string | null;
  option_group_name_ja?: string | null;
  option_group_name_vi?: string | null;
  option_group_name_en?: string | null;
  option_group_name_zh?: string | null;
}

export interface OrderItem {
  id: string | number;
  food_name_snap: string;
  quantity: number | string;
  price_at_time: number | string;
  image_snap: string | null;
  note: string | null;
  option_total?: number | string | null;
  tbl_customer_order_item_options?: OrderItemOption[];
}

export interface Order {
  id: string;
  order_token: string;
  order_number: number | null;
  store_id?: number | string | null;
  status: string | null;
  total_amount: number | string;
  currency: string;
  created_at: string;
  order_type?: string | null;
  scheduled_for?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  tbl_customer_order_items: OrderItem[];
}

export interface DisplayOrder extends Order {
  storeName?: string | null;
  localCreatedAt?: string | null;
}

export type Locale = 'ja' | 'en' | 'vi' | 'zh';