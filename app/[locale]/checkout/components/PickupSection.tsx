'use client';

import { useState, useEffect, useMemo } from 'react';
import './pickup-section.css';

interface PickupSectionProps {
  orderType: 'IMMEDIATE' | 'SCHEDULED_TIME';
  setOrderType: (type: 'IMMEDIATE' | 'SCHEDULED_TIME') => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  storeInfo?: {
    openTime?: string | Date;
    closeTime?: string | Date;
  };
  locale?: string;
}

const SLOT_INTERVAL_MINUTES = 10;
const ASAP_PREPARATION_MINUTES = 10;
const LAST_PICKUP_BUFFER_MINUTES = 10;
const MAX_SCHEDULE_DAYS = 7;

const translations = {
  ja: {
    title: '受取日時',
    immediate: '今すぐ受取',
    scheduled: 'ご予約',
    closedNotice: '本日の営業は終了しました。',
    notOpenNotice: '本日の営業はまだ開始していません。',
    noPickupNotice: '本日は受取可能な時間がありません。',
    labelImmediate: '最短の受取予定時間',
    labelScheduled: '受取日時を選択',
    noteText: '※混雑状況により、お渡しのお時間が前後する場合がございます。',
    today: '本日',
    tomorrow: '明日',
    afterTomorrow: '明後日',
    noAvailableTime: '受取可能な時間がありません',
  },
  vi: {
    title: 'Thời gian nhận món',
    immediate: 'Lấy ngay',
    scheduled: 'Đặt lịch nhận',
    closedNotice: 'Cửa hàng đã đóng cửa.',
    notOpenNotice: 'Cửa hàng chưa mở cửa hôm nay.',
    noPickupNotice: 'Hôm nay không còn thời gian nhận món.',
    labelImmediate: 'Thời gian nhận món dự kiến',
    labelScheduled: 'Chọn thời gian nhận',
    noteText: '※Do lượng khách đông, thời gian chuẩn bị có thể chênh lệch đôi chút.',
    today: 'Hôm nay',
    tomorrow: 'Ngày mai',
    afterTomorrow: 'Ngày kia',
    noAvailableTime: 'Không có thời gian nhận món',
  },
  en: {
    title: 'Pickup Time',
    immediate: 'ASAP', 
    scheduled: 'Schedule for Later', 
    closedNotice: 'The store is currently closed.',
    notOpenNotice: 'The store has not opened for the day yet.',
    noPickupNotice: 'No pickup slots are available for today.',
    labelImmediate: 'Estimated Pickup Time',
    labelScheduled: 'Select Date & Time', 
    noteText: '*Pickup times may vary slightly based on store traffic.', 
    today: 'Today',
    tomorrow: 'Tomorrow',
    afterTomorrow: 'Day after tomorrow',
    noAvailableTime: 'No available pickup times',
  },
  zh: {
    title: '取餐时间', 
    immediate: '立即取餐', 
    scheduled: '预约取餐', 
    closedNotice: '本店今日营业已结束。',
    notOpenNotice: '本店今日尚未开始营业。',
    noPickupNotice: '今天没有可用的取餐时间。',
    labelImmediate: '预计取餐时间（最快）',
    labelScheduled: '选择取餐时间',
    noteText: '※如遇客流高峰期，取餐时间可能会稍有浮动。', 
    today: '今天',
    tomorrow: '明天',
    afterTomorrow: '后天',
    noAvailableTime: '没有可用的取餐时间',
  },
};

type LocaleKey = keyof typeof translations;

export default function PickupSection({
  orderType,
  setOrderType,
  scheduledTime,
  setScheduledTime,
  storeInfo,
  locale = 'ja',
}: PickupSectionProps) {
  const t = translations[locale as LocaleKey] || translations.ja;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatStoreTimeString = (timeInput?: string | Date, fallback = '09:00') => {
    if (!timeInput) return fallback;

    if (timeInput instanceof Date) {
      if (Number.isNaN(timeInput.getTime())) return fallback;
      return timeInput
        .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
        .substring(0, 5);
    }

    if (typeof timeInput === 'string') {
      const trimmed = timeInput.trim();
      if (trimmed.includes('T')) {
        const timePart = trimmed.split('T')[1];
        return timePart ? timePart.substring(0, 5) : fallback;
      }
      const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }
      }
    }
    return fallback;
  };

  const timeToMinutes = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  };

  const minutesToTime = (totalMinutes: number) => {
    const normalized = ((totalMinutes % 1440) + 1440) % 1440;
    const hour = Math.floor(normalized / 60);
    const minute = normalized % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const ceilToSlot = (minutes: number, interval: number) => {
    return Math.ceil(minutes / interval) * interval;
  };

  const openTimeString = formatStoreTimeString(storeInfo?.openTime, '10:30');
  const closeTimeString = formatStoreTimeString(storeInfo?.closeTime, '23:30');

  const openTotalMinutes = timeToMinutes(openTimeString) ?? 10 * 60 + 30;
  const closeTotalMinutes = timeToMinutes(closeTimeString) ?? 23 * 60 + 30;

  const lastPickupMinutes = Math.max(openTotalMinutes, closeTotalMinutes - LAST_PICKUP_BUFFER_MINUTES);

  const currentDateString = formatLocalDate(now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isBeforeOpening = currentMinutes < openTotalMinutes;
  const isAfterClosing = currentMinutes >= closeTotalMinutes;

  const immediatePickupTime = useMemo(() => {
    if (isAfterClosing) return null;
    if (isBeforeOpening) {
      const earliest = ceilToSlot(openTotalMinutes + ASAP_PREPARATION_MINUTES, SLOT_INTERVAL_MINUTES);
      return earliest > lastPickupMinutes ? null : minutesToTime(earliest);
    }
    const earliest = ceilToSlot(currentMinutes + ASAP_PREPARATION_MINUTES, SLOT_INTERVAL_MINUTES);
    return earliest > lastPickupMinutes ? null : minutesToTime(earliest);
  }, [currentMinutes, isBeforeOpening, isAfterClosing, openTotalMinutes, lastPickupMinutes]);

  const hasImmediatePickup = immediatePickupTime !== null;

  const availableDays = useMemo(() => {
    const days: { value: string; label: string }[] = [];
    const today = new Date(now);
    const dateLocale = locale === 'ja' ? 'ja-JP' : locale === 'zh' ? 'zh-CN' : locale === 'vi' ? 'vi-VN' : 'en-US';

    for (let i = 0; i < MAX_SCHEDULE_DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const value = formatLocalDate(d);
      const month = d.getMonth() + 1;
      const date = d.getDate();

      let labelTag = '';
      if (i === 0) labelTag = t.today;
      else if (i === 1) labelTag = t.tomorrow;
      else if (i === 2) labelTag = t.afterTomorrow;
      else labelTag = d.toLocaleDateString(dateLocale, { weekday: 'short' });

      days.push({ value, label: `${month}/${date} (${labelTag})` });
    }
    return days;
  }, [currentDateString, locale, t]);

  const [selectedDate, setSelectedDate] = useState<string>(currentDateString);

  useEffect(() => {
    if (!availableDays.some(day => day.value === selectedDate)) {
      setSelectedDate(availableDays[0]?.value ?? currentDateString);
    }
  }, [availableDays, selectedDate, currentDateString]);

  const isSelectedToday = selectedDate === currentDateString;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const firstSlot = ceilToSlot(openTotalMinutes, SLOT_INTERVAL_MINUTES);
    for (let totalM = firstSlot; totalM <= lastPickupMinutes; totalM += SLOT_INTERVAL_MINUTES) {
      slots.push(minutesToTime(totalM));
    }
    return slots;
  }, [openTotalMinutes, lastPickupMinutes]);

  const isSlotDisabled = (slot: string) => {
    const slotMinutes = timeToMinutes(slot);
    if (slotMinutes === null || slotMinutes > lastPickupMinutes || slotMinutes < openTotalMinutes) return true;
    if (!isSelectedToday) return false;
    return slotMinutes < currentMinutes;
  };

  const validSlots = useMemo(() => {
    return timeSlots.filter(slot => !isSlotDisabled(slot));
  }, [timeSlots, selectedDate, currentDateString, currentMinutes]);

  const currentSelectedTime = scheduledTime ? scheduledTime.split('T')[1]?.substring(0, 5) ?? '' : '';

  useEffect(() => {
    if (!selectedDate || validSlots.length === 0) {
      if (validSlots.length === 0) setScheduledTime('');
      return;
    }
    const currentDatePart = scheduledTime?.split('T')[0] ?? '';
    const selectedTimeIsValid = currentDatePart === selectedDate && currentSelectedTime && validSlots.includes(currentSelectedTime);

    if (selectedTimeIsValid) return;
    setScheduledTime(`${selectedDate}T${validSlots[0]}`);
  }, [selectedDate, validSlots, scheduledTime, currentSelectedTime, setScheduledTime]);

  useEffect(() => {
    if (orderType === 'IMMEDIATE' && !hasImmediatePickup) {
      setOrderType('SCHEDULED_TIME');
    }
  }, [orderType, hasImmediatePickup, setOrderType]);

  const noticeText = useMemo(() => {
    if (isAfterClosing) return t.closedNotice;
    if (isBeforeOpening) return t.notOpenNotice;
    if (!hasImmediatePickup) return t.noPickupNotice;
    return null;
  }, [isAfterClosing, isBeforeOpening, hasImmediatePickup, t]);

  const handleSelectDate = (date: string) => setSelectedDate(date);
  const handleSelectTime = (time: string) => {
    if (!time || isSlotDisabled(time)) return;
    setScheduledTime(`${selectedDate}T${time}`);
  };

  const handleImmediateClick = () => {
    if (!hasImmediatePickup || !immediatePickupTime) return;
    setOrderType('IMMEDIATE');
    setSelectedDate(currentDateString);
    setScheduledTime(`${currentDateString}T${immediatePickupTime}`);
  };

  const handleScheduledClick = () => {
    setOrderType('SCHEDULED_TIME');
    if (selectedDate === currentDateString && validSlots.length === 0) {
      const nextDay = availableDays.find(day => day.value !== currentDateString);
      if (nextDay) setSelectedDate(nextDay.value);
    }
  };

  const selectValue = validSlots.includes(currentSelectedTime) ? currentSelectedTime : validSlots[0] ?? '';

  return (
    <div className="pickup-card">
      <div className="pickup-header">
        <span className="material-symbols-outlined">schedule</span>
        <h3>{t.title}</h3>
      </div>

      {noticeText && <div className="pickup-notice">{noticeText}</div>}

      <div className="pickup-tabs">
        <button
          type="button"
          className={`tab-btn ${orderType === 'IMMEDIATE' ? 'active' : ''} ${!hasImmediatePickup ? 'disabled' : ''}`}
          onClick={handleImmediateClick}
          disabled={!hasImmediatePickup}
        >
          <span className="tab-main">{t.immediate}</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${orderType === 'SCHEDULED_TIME' ? 'active' : ''}`}
          onClick={handleScheduledClick}
        >
          <span className="tab-main">{t.scheduled}</span>
        </button>
      </div>

      <div className="pickup-input-group">
        <label>
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
            {orderType === 'IMMEDIATE' ? 'bolt' : 'event_available'}
          </span>
          {orderType === 'IMMEDIATE' ? t.labelImmediate : t.labelScheduled}
        </label>

        {/* Thêm class 'pickup-selectors-row' để gom chung 1 hàng */}
        <div className={`pickup-selectors-row ${orderType === 'SCHEDULED_TIME' ? 'has-date' : ''}`}>
          {orderType === 'SCHEDULED_TIME' && (
            <select
              className="pickup-select"
              value={selectedDate}
              onChange={e => handleSelectDate(e.target.value)}
            >
              {availableDays.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          )}

          <select
            className="pickup-select"
            value={orderType === 'IMMEDIATE' ? immediatePickupTime || currentSelectedTime || '' : selectValue}
            onChange={e => handleSelectTime(e.target.value)}
            disabled={validSlots.length === 0}
          >
            {validSlots.length === 0 ? (
              <option value="">{t.noAvailableTime}</option>
            ) : (
              timeSlots.map(slot => (
                <option key={slot} value={slot} disabled={isSlotDisabled(slot)}>
                  {slot}
                </option>
              ))
            )}
          </select>
        </div>

        <p className="pickup-note">{t.noteText}</p>
      </div>
    </div>
  );
}