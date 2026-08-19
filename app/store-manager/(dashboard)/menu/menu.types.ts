export interface MenuCategory {
  id: number;
  menu_id: number;
  store_id: number;
  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;
  description_ja: string | null;
  description_vi: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  store_id: number;
  category_id: number;

  name_ja: string;
  name_vi: string | null;
  name_en: string | null;
  name_zh: string | null;

  description_ja: string | null;
  description_vi: string | null;
  description_en: string | null;
  description_zh: string | null;

  image_url: string | null;

  price: number;
  display_order: number;
  is_available: boolean;
}