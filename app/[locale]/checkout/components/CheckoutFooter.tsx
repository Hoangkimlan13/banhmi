'use client';

import {
  useCallback,
  useRef,
  useState,
} from 'react';

import styles from './CheckoutFooter.module.css';

interface CheckoutFooterProps {
  total: number;
  locale?: string;
  cartCount?: number;
  children?: React.ReactNode;
}

const footerTranslations = {
  ja: {
    totalLabel: 'お支払い合計',
    detailsToggle: 'ご注文内容',
    close: '閉じる',
    items: '点',
  },
  en: {
    totalLabel: 'Total',
    detailsToggle: 'Order Details',
    close: 'Close',
    items: 'items',
  },
  vi: {
    totalLabel: 'Tổng thanh toán',
    detailsToggle: 'Chi tiết đơn hàng',
    close: 'Đóng',
    items: 'món',
  },
  zh: {
    totalLabel: '应付总额',
    detailsToggle: '订单详情',
    close: '关闭',
    items: '件',
  },
};

const DRAG_CLOSE_DISTANCE = 120;
const DRAG_VELOCITY = 0.5;

export default function CheckoutFooter({
  total,
  locale = 'ja',
  cartCount = 0,
  children,
}: CheckoutFooterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const dragStartY = useRef(0);
  const dragStartTime = useRef(0);
  const lastY = useRef(0);

  const t =
    footerTranslations[
      locale as keyof typeof footerTranslations
    ] || footerTranslations.ja;

  const formattedTotal = Number(total || 0).toLocaleString();

  /**
   * Open panel
   */
  const openPanel = useCallback(() => {
    setIsOpen(true);
    setDragOffset(0);
  }, []);

  /**
   * Close panel
   */
  const closePanel = useCallback(() => {
    setIsOpen(false);
    setDragOffset(0);
    setIsDragging(false);
  }, []);

  /**
   * Start dragging from handle/header
   */
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    // Only primary pointer / finger
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    dragStartY.current = event.clientY;
    dragStartTime.current = performance.now();
    lastY.current = event.clientY;

    setIsDragging(true);

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  /**
   * Drag panel
   */
  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const currentY = event.clientY;
    const deltaY = currentY - dragStartY.current;

    // We only allow dragging DOWN.
    // Dragging upward keeps the panel fully open.
    const offset = Math.max(0, deltaY);

    lastY.current = currentY;

    setDragOffset(offset);
  };

  /**
   * Release panel
   */
  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) return;

    const currentY = event.clientY;
    const deltaY = Math.max(
      0,
      currentY - dragStartY.current
    );

    const elapsed = Math.max(
      1,
      performance.now() - dragStartTime.current
    );

    const velocity = deltaY / elapsed;

    setIsDragging(false);

    /**
     * Close when:
     * - dragged far enough
     * OR
     * - quick downward swipe
     */
    if (
      deltaY > DRAG_CLOSE_DISTANCE ||
      velocity > DRAG_VELOCITY
    ) {
      closePanel();
      return;
    }

    // Snap back to open
    setDragOffset(0);

    event.currentTarget.releasePointerCapture?.(
      event.pointerId
    );
  };

  const handlePointerCancel = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  /**
   * Panel transform
   */
  const panelStyle = {
    transform: isOpen
      ? `translateY(${dragOffset}px)`
      : undefined,
  };

  return (
    <>
      {/* =====================================================
          BACKDROP
          ===================================================== */}
      {isOpen && (
        <button
          type="button"
          aria-label={t.close}
          className={styles.backdrop}
          onClick={closePanel}
        />
      )}

      {/* =====================================================
          MOBILE ORDER DETAIL PANEL
          ===================================================== */}
      <section
        className={`${styles.slideUpPanel} ${
          isOpen ? styles.panelOpen : ''
        } ${isDragging ? styles.panelDragging : ''}`}
        style={isOpen ? panelStyle : undefined}
        aria-hidden={!isOpen}
      >
        <div className={styles.panelHeader}>
          {/* =================================================
              DRAG HANDLE
              ================================================= */}
          <div
            className={styles.panelHandleArea}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            role="button"
            tabIndex={0}
            aria-label={t.detailsToggle}
          >
            <span className={styles.handleIndicator} />
          </div>

          {/* =================================================
              HEADER
              ================================================= */}
          <div className={styles.panelHeaderContent}>
            <div className={styles.panelHeading}>
              <p className={styles.panelEyebrow}>
                {t.detailsToggle}
              </p>

              <h2 className={styles.panelTitle}>
                {t.totalLabel}
              </h2>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              aria-label={t.close}
              onClick={closePanel}
            >
              <span className="material-symbols-outlined">
                close
              </span>
            </button>
          </div>
        </div>

        {/* =====================================================
            SCROLLABLE CONTENT
            ===================================================== */}
        <div className={styles.panelContentScrollable}>
          {children}
        </div>
      </section>

      {/* =====================================================
          MOBILE BOTTOM BAR
          ===================================================== */}
      <div className={styles.footerContainer}>
        <div className={styles.footerInner}>
          {/* LEFT */}
          <button
            type="button"
            className={styles.detailsButton}
            onClick={openPanel}
            aria-expanded={isOpen}
          >
            <span className={styles.detailsIcon}>
              <span className="material-symbols-outlined">
                receipt_long
              </span>
            </span>

            <span className={styles.detailsText}>
              <span className={styles.detailsTitle}>
                {t.detailsToggle}
              </span>

              <span className={styles.detailsCount}>
                {cartCount > 0
                  ? `${cartCount}${t.items}`
                  : ''}
              </span>
            </span>

            <span
              className={`${styles.chevronIcon} ${
                isOpen ? styles.chevronOpen : ''
              }`}
            >
              <span className="material-symbols-outlined">
                expand_less
              </span>
            </span>
          </button>

          {/* RIGHT */}
          <button
            type="button"
            className={styles.totalButton}
            onClick={openPanel}
          >
            <span className={styles.totalLabel}>
              {t.totalLabel}
            </span>

            <span className={styles.totalAmount}>
              ¥{formattedTotal}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

