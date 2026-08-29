// components/product-detail/ProductDescription.tsx
"use client";

interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({
  description,
}: ProductDescriptionProps) {
  if (!description) return null;

  return <p className="modal-desc">{description}</p>;
}