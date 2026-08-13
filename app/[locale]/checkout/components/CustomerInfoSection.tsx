'use client';

import { useState } from 'react';
import './customer-info.css';

interface CustomerInfoSectionProps {
  orderType: 'IMMEDIATE' | 'SCHEDULED_TIME';
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  locale?: string;
}

const translations = {
  ja: {
    titleImmediate: 'お客様情報（任意）',
    titleScheduled: 'お客様情報（必須）',
    nameLabel: 'お名前',
    namePlaceholder: 'お名前を入力してください',
    phoneLabel: '電話番号',
    phonePlaceholder: '例: 09012345678 または 0312345678',
    optionalTag: '（任意）',
    requiredTag: '（必須）',
    phoneError: '有効な日本の電話番号を入力してください（携帯・固定電話対応）',
  },
  vi: {
    titleImmediate: 'Thông tin khách hàng (Không bắt buộc)',
    titleScheduled: 'Thông tin khách hàng (Bắt buộc)',
    nameLabel: 'Họ và tên',
    namePlaceholder: 'Nhập họ tên của bạn',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: 'Ví dụ: 09012345678 hoặc 0312345678',
    optionalTag: '(Không bắt buộc)',
    requiredTag: '(Bắt buộc)',
    phoneError: 'Vui lòng nhập đúng định dạng số điện thoại Nhật Bản (Di động hoặc Điện thoại bàn)',
  },
  en: {
    titleImmediate: 'Customer Information (Optional)',
    titleScheduled: 'Customer Information (Required)',
    nameLabel: 'Full Name',
    namePlaceholder: 'Enter your full name',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'e.g. 09012345678 or 0312345678',
    optionalTag: '(Optional)',
    requiredTag: '(Required)',
    phoneError: 'Please enter a valid Japanese phone number (Mobile or Landline)',
  },
  zh: {
    titleImmediate: '客户信息（选填）',
    titleScheduled: '客户信息（必填）',
    nameLabel: '姓名',
    namePlaceholder: '请输入您的姓名',
    phoneLabel: '电话号码',
    phonePlaceholder: '例如：09012345678 或 0312345678',
    optionalTag: '（选填）',
    requiredTag: '（必填）',
    phoneError: '请输入有效的日本电话号码（手机或固定电话）',
  },
};

type LocaleKey = keyof typeof translations;

export default function CustomerInfoSection({
  orderType,
  name,
  setName,
  phone,
  setPhone,
  locale = 'ja',
}: CustomerInfoSectionProps) {
  const t = translations[locale as LocaleKey] || translations.ja;
  const [phoneError, setPhoneError] = useState(false);

  // Nếu là đặt lịch trước (SCHEDULED_TIME) thì bắt buộc nhập, IMMEDIATE có thể tùy chọn
  const isCustomerInfoRequired = orderType === 'SCHEDULED_TIME';

  const title = isCustomerInfoRequired ? t.titleScheduled : t.titleImmediate;
  const fieldTag = isCustomerInfoRequired ? t.requiredTag : t.optionalTag;

  // Regex kiểm tra số điện thoại Nhật Bản chuẩn
  const validateJapanesePhone = (value: string) => {
    const cleanValue = value.replace(/[-ー\s]/g, '');
    if (cleanValue === '') return !isCustomerInfoRequired; // Nếu không bắt buộc thì cho phép trống
    const jpPhoneRegex = /^(0[1-9][0-9]{8,9})$/;
    return jpPhoneRegex.test(cleanValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.trim() === '') {
      setPhoneError(false);
    } else {
      setPhoneError(!validateJapanesePhone(val));
    }
  };

  return (
    <div className="customer-info-card">
      <div className="customer-info-header">
        <span className="material-symbols-outlined" aria-hidden="true">person</span>
        <h3>{title}</h3>
      </div>

      <div className="customer-info-group">
        {/* お名前 */}
        <div className="customer-field">
          <label htmlFor="customer-name">
            <span className="material-symbols-outlined" aria-hidden="true">badge</span>
            <span>{t.nameLabel}</span>
            <span className={isCustomerInfoRequired ? 'required-text' : 'optional-text'}>
              {fieldTag}
            </span>
          </label>

          <input
            id="customer-name"
            type="text"
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isCustomerInfoRequired}
            autoComplete="name"
            className="customer-input"
          />
        </div>

        {/* 電話番号 */}
        <div className="customer-field">
          <label htmlFor="customer-phone">
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
            <span>{t.phoneLabel}</span>
            <span className={isCustomerInfoRequired ? 'required-text' : 'optional-text'}>
              {fieldTag}
            </span>
          </label>

          <input
            id="customer-phone"
            type="tel"
            inputMode="tel"
            placeholder={t.phonePlaceholder}
            value={phone}
            onChange={handlePhoneChange}
            required={isCustomerInfoRequired}
            autoComplete="tel"
            className={`customer-input ${phoneError ? 'input-error' : ''}`}
          />
          {phoneError && (
            <span className="error-message">{t.phoneError}</span>
          )}
        </div>
      </div>
    </div>
  );
}