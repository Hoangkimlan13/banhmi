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
    nameLabel: 'お名前（カタカナ）',
    namePlaceholder: '例：ヤマダ タロウ',
    phoneLabel: '電話番号',
    phonePlaceholder: '例: 09012345678 または 0312345678',
    optionalTag: '（任意）',
    requiredTag: '（必須）',
    phoneError: '有効な日本の電話番号を入力してください（携帯・固定電話対応）',
    nameError: '全角カタカナで入力してください（例：ヤマダ タロウ）',
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
    nameError: 'Vui lòng nhập họ tên hợp lệ',
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
    nameError: 'Please enter a valid name (letters, spaces, hyphens, apostrophes)',
  },
  zh: {
    titleImmediate: '客户信息（选填）',
    titleScheduled: '客户信息（必填）',
    nameLabel: '姓名（英文）',
    namePlaceholder: '例如：Yamada Taro',
    phoneLabel: '电话号码',
    phonePlaceholder: '例如：09012345678 或 0312345678',
    optionalTag: '（选填）',
    requiredTag: '（必填）',
    phoneError: '请输入有效的日本电话号码（手机或固定电话）',
    nameError: '请使用英文字母输入姓名（例如：Yamada Taro）',
  },
  ko: {
    titleImmediate: '고객 정보 (선택)',
    titleScheduled: '고객 정보 (필수)',
    nameLabel: '성명',
    namePlaceholder: '이름을 입력하세요',
    phoneLabel: '전화번호',
    phonePlaceholder: '예: 09012345678 또는 0312345678',
    optionalTag: '(선택)',
    requiredTag: '(필수)',
    phoneError: '유효한 일본 전화번호를 입력하세요 (휴대폰 또는 유선)',
    nameError: '유효한 이름을 입력하세요',
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
  const [nameError, setNameError] = useState(false);

  const isCustomerInfoRequired = orderType === 'SCHEDULED_TIME';

  const title = isCustomerInfoRequired ? t.titleScheduled : t.titleImmediate;
  const fieldTag = isCustomerInfoRequired ? t.requiredTag : t.optionalTag;

  // ============================================================
  // VALIDATION: TÊN
  // ============================================================
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') return !isCustomerInfoRequired; // Nếu không bắt buộc thì cho phép trống

    if (locale === 'ja') {
      // Katakana (全角カタカナ) + khoảng trắng + dấu gạch ngang
      const katakanaRegex = /^[ァ-ヴー\s\-]+$/;
      return katakanaRegex.test(trimmed);
    }

    if (locale === 'zh') {
      // Latin: chữ cái (có dấu), khoảng trắng, dấu gạch ngang, dấu nháy
      const latinRegex = /^[a-zA-ZÀ-ỹ\s\-']+$/;
      return latinRegex.test(trimmed);
    }

    // Các ngôn ngữ khác: chỉ kiểm tra không chứa ký tự đặc biệt nguy hiểm
    const basicRegex = /^[a-zA-ZÀ-ỹ\s\-']+$/;
    return basicRegex.test(trimmed);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.trim() === '') {
      setNameError(false);
    } else {
      setNameError(!validateName(val));
    }
  };

  // ============================================================
  // VALIDATION: SỐ ĐIỆN THOẠI
  // ============================================================
  const validateJapanesePhone = (value: string) => {
    const cleanValue = value.replace(/[-ー\s]/g, '');
    if (cleanValue === '') return !isCustomerInfoRequired;
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

  // ============================================================
  // RENDER
  // ============================================================
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
            onChange={handleNameChange}
            required={isCustomerInfoRequired}
            autoComplete="name"
            className={`customer-input ${nameError ? 'input-error' : ''}`}
          />
          {nameError && (
            <span className="error-message">{t.nameError}</span>
          )}
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