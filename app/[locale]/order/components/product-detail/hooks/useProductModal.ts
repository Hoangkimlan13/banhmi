// components/product-detail/hooks/useProductModal.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseProductModalOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function useProductModal({ isOpen, onClose }: UseProductModalOptions) {
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const modalBodyRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  // Reset scroll khi mở modal
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setIsScrolled(false);
      lastScrollTopRef.current = 0;
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }
  }, [isOpen]);

  // Xử lý scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const currentScrollTop = el.scrollTop;
    const canScroll = el.scrollHeight > el.clientHeight + 10;

    if (!canScroll) {
      if (isScrolled) {
        setIsScrolled(false);
      }
      return;
    }

    const isScrollingDown = currentScrollTop > lastScrollTopRef.current;

    if (isScrollingDown && currentScrollTop > 40) {
      setIsScrolled(true);
    } else if (!isScrollingDown && currentScrollTop <= 10) {
      setIsScrolled(false);
    }

    lastScrollTopRef.current = currentScrollTop;
  }, [isScrolled]);

  // Đóng modal với animation
  const handleTriggerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  }, [onClose]);

  return {
    isClosing,
    isScrolled,
    modalBodyRef,
    handleScroll,
    handleTriggerClose,
  };
}