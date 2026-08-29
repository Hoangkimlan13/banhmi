// components/product-detail/ProductOptionGroups.tsx
"use client";

import { getGroupKey, isMultipleGroup, getGroupRequired } from "../shared/menu-helpers";
import ProductOptionGroup from "./ProductOptionGroup";

interface ProductOptionGroupsProps {
  optionGroups: any[];
  selectedOptions: Record<string, any>;
  locale: string;
  requiredLabel: string;
  optionalLabel: string;
  freeLabel: string;
  onSelectOption: (group: any, groupIndex: number, option: any) => void;
  getOptionPrice: (option: any) => number;
  getGroupName: (group: any) => string;
  getOptionName: (option: any) => string; // thêm hàm lấy tên option
}

export default function ProductOptionGroups({
  optionGroups,
  selectedOptions,
  locale,
  requiredLabel,
  optionalLabel,
  freeLabel,
  onSelectOption,
  getOptionPrice,
  getGroupName,
  getOptionName, // nhận hàm
}: ProductOptionGroupsProps) {
  if (!optionGroups || !Array.isArray(optionGroups) || optionGroups.length === 0) {
    return null;
  }

  return (
    <>
      {optionGroups.map((group: any, groupIndex: number) => {
        const groupKey = getGroupKey(group, groupIndex);
        const multiple = isMultipleGroup(group);
        const required = getGroupRequired(group);
        const currentSelected = selectedOptions[groupKey];

        return (
          <ProductOptionGroup
            key={groupKey}
            group={group}
            groupKey={groupKey}
            groupName={getGroupName(group)}
            required={required}
            multiple={multiple}
            requiredLabel={requiredLabel}
            optionalLabel={optionalLabel}
            freeLabel={freeLabel}
            currentSelected={currentSelected}
            options={group.options || []}
            locale={locale}
            getOptionName={getOptionName}
            onSelectOption={(option) => onSelectOption(group, groupIndex, option)}
            getOptionPrice={getOptionPrice}
          />
        );
      })}
    </>
  );
}