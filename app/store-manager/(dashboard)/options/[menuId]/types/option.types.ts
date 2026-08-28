export type OptionGroup = {
  id: number;

  menu_id: number;

  code: string;

  name_ja: string;

  name_vi: string | null;

  name_en: string | null;

  name_zh: string | null;

  description: string | null;

  is_available: boolean;

  is_required: boolean;

  type: "single" | "multiple";

  max_choices: number;

  sort_order: number;

  created_at: Date;

  updated_at: Date;

  items: OptionItem[];

  usage_count?: number;
};

export type OptionItem = {
  id: number;

  option_group_id: number;

  code: string;

  name_ja: string;

  name_vi: string | null;

  name_en: string | null;

  name_zh: string | null;

  icon_url: string | null;

  price: number;

  is_available: boolean;

  sort_order: number;

  created_at: Date;

  updated_at: Date;

  usage_count?: number;
};

export type OptionGroupFormData = {
  code: string;

  name_ja: string;

  name_vi: string;

  name_en: string;

  name_zh: string;

  description: string;

  sort_order: number;

  is_available: boolean;

  is_required: boolean;

  type: "single" | "multiple";

  max_choices: number | string;
};

export type OptionItemFormData = {
  option_group_id: number;

  code: string;

  name_ja: string;

  name_vi: string;

  name_en: string;

  name_zh: string;

  icon_url: string;

  price: string;

  sort_order: number;

  is_available: boolean;
};