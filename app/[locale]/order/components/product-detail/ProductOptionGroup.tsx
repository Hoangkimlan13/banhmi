// components/product-detail/ProductOptionGroup.tsx
"use client";

import ProductOptionCard from "./ProductOptionCard";

interface ProductOptionGroupProps {
  group: any;
  groupKey: string;
  groupName: string;
  required: boolean;
  multiple: boolean;
  requiredLabel: string;
  optionalLabel: string;
  freeLabel: string;
  currentSelected: any;
  options: any[];
  locale: string;                       // thêm locale
  getOptionName: (option: any) => string; // thêm hàm lấy tên option
  onSelectOption: (option: any) => void;
  getOptionPrice: (option: any) => number;
}

export default function ProductOptionGroup({
  group,
  groupKey,
  groupName,
  required,
  multiple,
  requiredLabel,
  optionalLabel,
  freeLabel,
  currentSelected,
  options,
  locale,
  getOptionName,
  onSelectOption,
  getOptionPrice,
}: ProductOptionGroupProps) {
  return (
    <div
      data-option-group-key={groupKey}
      className={`option-group-section ${
        required ? "option-group-required" : "option-group-optional"
      }`}
      style={{ marginBottom: "28px" }}
    >
      <div className="group-title-row">
        <div className="group-title-left">
          <h3>{groupName}</h3>
          <span className={required ? "badge-required" : "badge-optional"}>
            {required ? requiredLabel : optionalLabel}
          </span>
        </div>
      </div>

      <div
        className={`options-grid ${
          multiple ? "options-multiple" : "options-single"
        }`}
      >
        {options.map((opt: any, optIndex: number) => {
          const isSelected = multiple
            ? Array.isArray(currentSelected) &&
              currentSelected.some(
                (item: any) => String(item?.id) === String(opt?.id)
              )
            : !!currentSelected &&
              !Array.isArray(currentSelected) &&
              String(currentSelected?.id) === String(opt?.id);

          const price = getOptionPrice(opt);
          const optionName = getOptionName(opt); // localize option name

          return (
            <ProductOptionCard
              key={opt.id ?? `${groupKey}-option-${optIndex}`}
              option={opt}
              optionName={optionName}
              isSelected={isSelected}
              multiple={multiple}
              price={price}
              freeLabel={freeLabel}
              onSelect={() => onSelectOption(opt)}
            />
          );
        })}
      </div>
    </div>
  );
}