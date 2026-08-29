"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseProductDetailOptions {
  isOpen: boolean;
  itemId: any;
  locale: string;
  getErrorMessage: (locale: string) => string;
}

export function useProductDetail({
  isOpen,
  itemId,
  locale,
  getErrorMessage,
}: UseProductDetailOptions) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * Dùng requestId để chống race condition:
   * - Mở item A → request A chạy
   * - Mở item B → request B chạy
   * - Nếu A trả về sau B thì KHÔNG ghi đè product B
   */
  const requestIdRef = useRef(0);

  const loadProduct = useCallback(async () => {
    if (!isOpen || !itemId) {
      return null;
    }

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setProduct(null);
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/menu-items/${itemId}?locale=${encodeURIComponent(locale)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      // Parse JSON trước, có thể throw lỗi nếu response không phải JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // Nếu không parse được JSON, đây là lỗi kỹ thuật
        if (requestId !== requestIdRef.current) {
          return null;
        }
        setErrorMessage(getErrorMessage(locale));
        return null;
      }

      // ============================================================
      // 1. HTTP ERROR (status >= 400)
      // ============================================================
      if (!response.ok) {
        if (requestId !== requestIdRef.current) {
          return null;
        }
        const errorMsg = data?.message || data?.error || `Failed to load product: ${response.status}`;
        setErrorMessage(errorMsg);
        return null;
      }

      // ============================================================
      // 2. API BUSINESS ERROR (success = false)
      // ============================================================
      if (!data?.success || !data?.data) {
        if (requestId !== requestIdRef.current) {
          return null;
        }
        const errorMsg = data?.message || "Failed to load product";
        setErrorMessage(errorMsg);
        return null;
      }

      // ============================================================
      // 3. SUCCESS
      // ============================================================
      // Nếu request này không còn là request mới nhất thì bỏ qua
      if (requestId !== requestIdRef.current) {
        return null;
      }

      const loadedProduct = data.data;
      setProduct(loadedProduct);

      // Tìm variant khả dụng
      const availableVariants = Array.isArray(loadedProduct?.variants)
        ? loadedProduct.variants.filter((variant: any) => {
            if (!variant) return false;
            if (variant.is_available === false) return false;
            if (variant.deleted_at) return false;
            const stockStatus = String(variant.stock_status ?? "available").toLowerCase();
            return ![
              "sold_out",
              "unavailable",
              "out_of_stock",
              "paused",
              "inactive",
            ].includes(stockStatus);
          })
        : [];

      const defaultVariant =
        availableVariants.find((variant: any) => variant?.is_default === true) ??
        availableVariants[0] ??
        null;

      return {
        product: loadedProduct,
        defaultVariant,
      };
    } catch (error) {
      // ============================================================
      // 4. NETWORK / UNEXPECTED ERROR
      // ============================================================
      if (requestId !== requestIdRef.current) {
        return null;
      }

      console.error("[useProductDetail] Unexpected error:", error);
      setErrorMessage(getErrorMessage(locale));
      return null;
    } finally {
      // Chỉ request mới nhất được phép tắt loading
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [isOpen, itemId, locale, getErrorMessage]);

  // ============================================================
  // EFFECT: Load product khi modal mở hoặc itemId thay đổi
  // ============================================================
  useEffect(() => {
    if (!isOpen || !itemId) {
      setProduct(null);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    loadProduct();

    return () => {
      // Invalidate request cũ
      requestIdRef.current += 1;
    };
  }, [isOpen, itemId, locale, loadProduct]);

  // ============================================================
  // EFFECT: Reset khi modal đóng
  // ============================================================
  useEffect(() => {
    if (!isOpen) {
      requestIdRef.current += 1;
      setProduct(null);
      setLoading(false);
      setErrorMessage("");
    }
  }, [isOpen]);

  return {
    product,
    loading,
    errorMessage,
    loadProduct,
    setProduct,
    setErrorMessage,
    setLoading,
  };
}