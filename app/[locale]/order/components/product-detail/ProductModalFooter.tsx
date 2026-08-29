// components/product-detail/ProductModalFooter.tsx
"use client";

interface ProductModalFooterProps {
  validating: boolean;
  formValid: boolean;
  continueLabel: string;
  checkoutLabel: string;
  validatingLabel: string;
  onContinue: () => void;
  onCheckout: () => void;
}

export default function ProductModalFooter({
  validating,
  formValid,
  continueLabel,
  checkoutLabel,
  validatingLabel,
  onContinue,
  onCheckout,
}: ProductModalFooterProps) {
  const isDisabled = !formValid || validating;

  return (
    <div className="modal-footer-dual">
      <button
        type="button"
        className={`action-btn-secondary ${isDisabled ? "disabled" : ""}`}
        onClick={onContinue}
        disabled={isDisabled}
      >
        <span>{validating ? validatingLabel : continueLabel}</span>
      </button>

      <button
        type="button"
        className={`action-btn-primary ${isDisabled ? "disabled" : ""}`}
        onClick={onCheckout}
        disabled={isDisabled}
      >
        <span>{validating ? validatingLabel : checkoutLabel}</span>
      </button>
    </div>
  );
}