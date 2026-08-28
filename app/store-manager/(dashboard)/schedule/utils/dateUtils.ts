// ============================================================
// DATE UTILS
// ============================================================

/**
 * Date -> YYYY-MM-DD
 *
 * Không dùng toISOString() vì có thể gây lệch ngày
 * do timezone.
 */
export function dateToKey(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Lấy YYYY-MM-DD từ API DateTime/string.
 */
export function formatDate(
  value: string
): string {
  return value.slice(0, 10);
}

/**
 * Format DateTime hoặc TIME về HH:mm.
 *
 * Hỗ trợ:
 * 2026-08-23T10:00:00.000Z
 * 2026-08-23T10:00:00
 * 10:00
 * 10:00:00
 */
export function formatTime(
  value: string | null
): string {
  if (!value) {
    return "";
  }

  const isoMatch = value.match(
    /T(\d{2}):(\d{2})/
  );

  if (isoMatch) {
    return `${isoMatch[1]}:${isoMatch[2]}`;
  }

  const timeMatch = value.match(
    /(\d{2}):(\d{2})/
  );

  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  return "";
}

/**
 * First day of month.
 */
export function monthStart(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

/**
 * Last day of month.
 */
export function monthEnd(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );
}

/**
 * Tạo danh sách ngày cho calendar.
 *
 * Calendar luôn bắt đầu từ Sunday
 * và kết thúc ở Saturday.
 */
export function buildCalendarDays(
  currentMonth: Date
): Date[] {
  const first = monthStart(
    currentMonth
  );

  const last = monthEnd(
    currentMonth
  );

  const startWeekDay =
    first.getDay();

  const days: Date[] = [];

  // Previous month
  for (
    let i = startWeekDay - 1;
    i >= 0;
    i--
  ) {
    const date = new Date(first);

    date.setDate(
      first.getDate() - i - 1
    );

    days.push(date);
  }

  // Current month
  for (
    let day = 1;
    day <= last.getDate();
    day++
  ) {
    days.push(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      )
    );
  }

  // Next month
  while (days.length % 7 !== 0) {
    const date = new Date(
      days[days.length - 1]
    );

    date.setDate(
      date.getDate() + 1
    );

    days.push(date);
  }

  return days;
}

/**
 * Kiểm tra date có nằm trong current month hay không.
 */
export function isSameMonth(
  date: Date,
  currentMonth: Date
): boolean {
  return (
    date.getMonth() ===
      currentMonth.getMonth() &&
    date.getFullYear() ===
      currentMonth.getFullYear()
  );
}