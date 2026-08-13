'use client';

import './order-summary.css';

interface OrderSummarySectionProps {
  cart: any[];
  total: number;
  locale?: string;
}

const translations = {
  ja: {
    title: 'ご注文内容の確認',
    quantity: '数量:',
    subtotal: '小計',
    tax: '消費税',
    taxIncluded: '込み',
    total: '合計金額',
    defaultItem: '商品',
    noteLabel: 'ご要望',
  },
  vi: {
    title: 'Tóm tắt đơn hàng',
    quantity: 'Số lượng:',
    subtotal: 'Tạm tính',
    tax: 'Thuế',
    taxIncluded: 'Đã bao gồm',
    total: 'Tổng cộng',
    defaultItem: 'Món ăn',
    noteLabel: 'Ghi chú',
  },
  en: {
    title: 'Order Summary',
    quantity: 'Qty:',
    subtotal: 'Subtotal',
    tax: 'Tax (Incl.)',
    taxIncluded: 'Included',
    total: 'Total',
    defaultItem: 'Item',
    noteLabel: 'Note',
  },
  zh: {
    title: '订单摘要',
    quantity: '数量:',
    subtotal: '小计',
    tax: '税费',
    taxIncluded: '已包含',
    total: '总计',
    defaultItem: '商品',
    noteLabel: '备注',
  },
};

type LocaleKey = keyof typeof translations;

// Hàm tạo cartKey chuẩn xác dựa trên ID sản phẩm, các option đã chọn và ghi chú
export function generateCartKey(itemId: number | string, selectedOptions: Record<number, any>, note: string): string {
  const sortedOptionIds = Object.values(selectedOptions)
    .flatMap((val: any) => Array.isArray(val) ? val.map((o: any) => o.id) : [val?.id])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .join(',');

  const cleanNote = note.trim().toLowerCase();

  return `${itemId}_opt[${sortedOptionIds}]_note[${cleanNote}]`;
}

export default function OrderSummarySection({ cart, total, locale = 'ja' }: OrderSummarySectionProps) {
  const t = translations[locale as LocaleKey] || translations.ja;

  const getLocalizedText = (
    obj: any,
    currentLocale: string
  ) => {
    if (!obj) return "";
    if (typeof obj === "string") return obj;

    return (
      obj[`name_${currentLocale}`] ||
      obj[`title_${currentLocale}`] ||
      obj[`display_name_${currentLocale}`] ||
      obj.name_ja ||
      obj.title_ja ||
      obj.display_name_ja ||
      obj.name_vi ||
      obj.title_vi ||
      obj.display_name_vi ||
      obj.name_en ||
      obj.title_en ||
      obj.display_name_en ||
      obj.name_zh ||
      obj.title_zh ||
      obj.display_name_zh ||
      obj.name ||
      obj.title ||
      t.defaultItem
    );
  };

  
  const renderSelectedOptions = (item: any, currentLocale: string) => {
  const selectedOptions = item.selectedOptions;
  const optionGroups = item.optionGroups || [];

  if (
    !selectedOptions ||
    Object.keys(selectedOptions).length === 0
  ) {
    return null;
  }

  return (
    <div className="order-item-options">
      {Object.entries(selectedOptions).map(
        ([groupId, val]: [string, any], idx) => {

          const cleanGroupId =
            String(groupId).replace('group-', '');

          const groupInfo = optionGroups.find(
            (g: any) =>
              String(g.id) === cleanGroupId ||
              String(g.id) === String(groupId)
          );

          // ✅ KHÔNG dùng:
          // groupInfo[`display_name_${currentLocale}`]

          // ✅ Dùng helper đã có
          const groupName =
            getLocalizedText(
              groupInfo,
              currentLocale
            );

          const optionsList =
            Array.isArray(val)
              ? val
              : [val];

          if (
            optionsList.length === 0 ||
            !optionsList[0]
          ) {
            return null;
          }

          return (
            <div
              key={idx}
              className="order-option-group-row"
              style={{ marginBottom: '8px' }}
            >
              <div
                className="order-option-row-item"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                {groupName && (
                  <span
                    className="order-option-group-title"
                    style={{
                      fontWeight: '600',
                      fontSize: '0.9em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {groupName}:
                  </span>
                )}

                <div
                  className="order-option-tags"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  {optionsList.map(
                    (opt: any, oIdx: number) => {

                      let realOpt = opt;

                      if (
                        groupInfo &&
                        groupInfo.options
                      ) {
                        const found =
                          groupInfo.options.find(
                            (o: any) =>
                              String(o.id) ===
                              String(opt.id)
                          );

                        if (found) {
                          realOpt = found;
                        }
                      }

                      const optName =
                        getLocalizedText(
                          realOpt,
                          currentLocale
                        );

                      const optPrice =
                        Number(
                          realOpt.price ||
                          opt.price ||
                          0
                        );

                      return (
                        <span
                          key={oIdx}
                          className="order-option-tag-pill"
                          style={{
                            fontSize: '0.9em',
                          }}
                        >
                          {optName}

                          {optPrice > 0
                            ? ` (+¥${optPrice.toLocaleString()})`
                            : ''}
                        </span>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
};

  return (
    <div className="order-summary-card">
      <div className="order-summary-header">
        <div className="order-header-icon-wrapper">
          <span className="material-symbols-outlined">receipt_long</span>
        </div>
        <h2>{t.title}</h2>
      </div>

      <div className="order-items-container">
        {cart.map((item) => {
          const uniqueKey =
            item.cartKey ||
            generateCartKey(item.menuItemId || item.itemId || item.id, item.selectedOptions || {}, item.note || '');
          const itemName = getLocalizedText(item, locale);

          return (
            <div key={uniqueKey} className="order-item-row">
              <div className="order-item-info">
                <div className="order-item-top-line">
                  <h4 className="order-item-name">{itemName}</h4>
                  <span className="order-item-price">¥{Number(item.totalPrice || 0).toLocaleString()}</span>
                </div>

                <div className="order-item-qty-row">
                  <span className="order-item-qty-label">{t.quantity}</span>
                  <span className="order-item-qty-value">{item.quantity}</span>
                </div>

                {renderSelectedOptions(item, locale)}

                {item.note && (
                  <div className="order-item-note">
                    <span className="order-note-tag">{t.noteLabel}:</span> {item.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="order-summary-footer">
        <div className="summary-row">
          <span className="summary-label">{t.subtotal}</span>
          <span className="summary-value">¥{Number(total || 0).toLocaleString()}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">{t.tax}</span>
          <span className="summary-value-muted">({t.taxIncluded})</span>
        </div>
        <div className="summary-row total-row">
          <span className="summary-label-total">{t.total}</span>
          <span className="summary-value-total">¥{Number(total || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}