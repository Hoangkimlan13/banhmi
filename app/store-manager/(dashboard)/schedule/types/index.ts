// ============================================================
// SCHEDULE TYPES
// ============================================================

export type ScheduleType =
  | "LOCATION"
  | "EVENT"
  | "CLOSED";

export type ScheduleStatus =
  | "SCHEDULED"
  | "OPEN"
  | "CLOSED"
  | "CANCELLED"
  | "COMPLETED";

// ============================================================
// LOCATION
// ============================================================

export type Location = {
  id: number;
  name: string;
  address: string | null;
  google_map_url: string | null;
  latitude: number | string | null;
  longitude: number | string | null;

  default_open_time: string | null;
  default_close_time: string | null;

  // Giữ lại để tương thích DB/API.
  // UI schedule hiện tại không hiển thị ラストオーダー.
  default_last_order_time: string | null;

  pickup_note: string | null;
  note: string | null;
};

// ============================================================
// MENU
// ============================================================

export type Menu = {
  id: number;
  name: string;
  is_default: boolean | null;
};

// ============================================================
// SCHEDULE
// ============================================================

export type Schedule = {
  id: number;
  store_id: number;

  location_id: number | null;
  menu_id: number | null;

  work_date: string;

  schedule_type: ScheduleType;

  location_name: string | null;
  address: string | null;
  google_map_url: string | null;

  open_time: string | null;
  close_time: string | null;

  // Giữ để đọc dữ liệu cũ/API.
  last_order_time: string | null;

  accepting_orders: boolean;

  status: ScheduleStatus;

  close_reason: string | null;
  closed_at: string | null;
  reopen_at: string | null;

  note: string | null;
  pickup_note: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  tbl_store_location?: Location | null;
  tbl_menu?: Menu | null;
};

// ============================================================
// TOAST
// ============================================================

export type ToastType =
  | "success"
  | "error";

export type ToastState = {
  show: boolean;
  message: string;
  type: ToastType;
};