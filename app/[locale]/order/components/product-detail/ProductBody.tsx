// components/product-detail/ProductBody.tsx
"use client";

import { forwardRef } from "react";
import ProductDescription from "./ProductDescription";
import ProductAllergens from "./ProductAllergens";
import ProductOptionGroups from "./ProductOptionGroups";
import ProductNote from "./ProductNote";
import ProductVariantSelector from "./ProductVariantSelector";

interface ProductBodyProps {
  product: any;
  locale: string;
  selectedOptions: Record<string, any>;
  selectedVariant: any;
  note: string;
  errorMessage: string;
  showAllergens: boolean;
  dict: any;
  onSetNote: (value: string) => void;
  onToggleAllergens: () => void;
  onSelectOption: (group: any, groupIndex: number, option: any) => void;
  onSelectVariant: (variant: any) => void;
  getOptionPrice: (option: any) => number;
  getGroupName: (group: any) => string;
  getOptionName: (option: any) => string;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const ProductBody = forwardRef<HTMLDivElement, ProductBodyProps>(
  (
    {
      product,
      locale,
      selectedOptions,
      selectedVariant,
      note,
      errorMessage,
      showAllergens,
      dict,
      onSetNote,
      onToggleAllergens,
      onSelectOption,
      onSelectVariant,
      getOptionPrice,
      getGroupName,
      getOptionName,
      onScroll,
    },
    ref
  ) => {
    
    const allergensSubtitle =
      locale === "ja" ? "アレルギーをお持ちの方はご確認ください" : "";

    return (
      <div
        className="modal-body"
        ref={ref}
        onScroll={onScroll}
      >
        <ProductDescription description={product.description} />

        <ProductAllergens
          allergens={product.allergens}
          locale={locale}
          showAllergens={showAllergens}
          onToggle={onToggleAllergens}
          label={dict.allergens}                 
          subtitle={allergensSubtitle}          
        />

        <ProductVariantSelector
          product={product}
          selectedVariant={selectedVariant}
          locale={locale}
          onSelectVariant={onSelectVariant}
          requiredLabel={dict.required}
          optionalLabel={dict.optional}
        />

        <ProductOptionGroups
          optionGroups={product.optionGroups}
          selectedOptions={selectedOptions}
          locale={locale}
          requiredLabel={dict.required}
          optionalLabel={dict.optional}
          freeLabel={dict.free}
          onSelectOption={onSelectOption}
          getOptionPrice={getOptionPrice}
          getGroupName={getGroupName}
          getOptionName={getOptionName}
        />

        <ProductNote
          label={dict.noteLabel}
          placeholder={dict.notePlaceholder}
          value={note}
          onChange={onSetNote}
        />

        {errorMessage && (
          <div className="error-message" role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

ProductBody.displayName = "ProductBody";