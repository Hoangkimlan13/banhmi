// components/product-detail/utils/cart-validator.ts
"use client";

export interface ValidateCartItemParams {
  cartItem: any;
  locale: string;
  storeSlug?: string | null; // ✅ NHẬN
  setValidating: (val: boolean) => void;
  setError: (msg: string) => void;
  getLocalizedMessage: (key: string) => string;
}

export async function validateCartItem({
  cartItem,
  locale,
  storeSlug, // ✅ NHẬN
  setValidating,
  setError,
  getLocalizedMessage,
}: ValidateCartItemParams): Promise<boolean> {
  try {
    setValidating(true);
    setError("");

    // ============================================================
    // BUILD REQUEST BODY (THÊM storeSlug)
    // ============================================================

    const body: any = {
      items: [
        {
          menuItemId: Number(cartItem.menuItemId),
          variantId: cartItem.variantId ?? null,
          quantity: Number(cartItem.quantity),
          selectedOptions: cartItem.selectedOptions ?? {},
        },
      ],
    };

    // Nếu có storeSlug, gửi kèm
    if (storeSlug) {
      body.storeSlug = storeSlug;
    }

    const response = await fetch("/api/cart/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Validation failed");
    }

    if (!data?.success || !data?.valid) {
      const result = Array.isArray(data?.items) ? data.items[0] : null;

      if (result?.reason === "ITEM_UNAVAILABLE") {
        setError(getLocalizedMessage("ITEM_UNAVAILABLE"));
        return false;
      }

      if (result?.reason === "VARIANT_UNAVAILABLE") {
        setError(getLocalizedMessage("VARIANT_UNAVAILABLE"));
        return false;
      }

      if (result?.reason === "VARIANT_NOT_FOUND") {
        setError(getLocalizedMessage("VARIANT_NOT_FOUND"));
        return false;
      }

      if (result?.reason === "INVALID_VARIANT") {
        setError(getLocalizedMessage("INVALID_VARIANT"));
        return false;
      }

      setError(getLocalizedMessage("GENERIC_ERROR"));
      return false;
    }

    return true;
  } catch (error) {
    console.error("[validateCartItem] Cart validation failed:", error);
    setError(getLocalizedMessage("NETWORK_ERROR"));
    return false;
  } finally {
    setValidating(false);
  }
}