/**
 * Date Utility Functions using the device's local timezone.
 */

/**
 * Returns a YYYY-MM-DD string for a given Date object using local timezone values.
 */
export const formatDateToLocalStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's YYYY-MM-DD string using local timezone values.
 */
export const getTodayLocalDateStr = (): string => {
  return formatDateToLocalStr(new Date());
};

/**
 * Safely parses a YYYY-MM-DD string into a local Date object.
 */
export const parseLocalDateStr = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

/**
 * Checks if a given YYYY-MM-DD date string is strictly prior to today's local date.
 */
export const isPreviousDateLocked = (dateStr: string): boolean => {
  return dateStr < getTodayLocalDateStr();
};

/**
 * Checks if a given date is locked for editing.
 * Today is the only editable day. Previous and future dates are view-only.
 */
export const isDateLocked = (dateStr: string): boolean => {
  return dateStr !== getTodayLocalDateStr();
};

/**
 * Returns formatted relative label + date for display headers:
 * - "Today • YYYY-MM-DD"
 * - "Tomorrow • YYYY-MM-DD"
 * - "Yesterday • YYYY-MM-DD"
 * - "YYYY-MM-DD"
 */
export const getRelativeDateLabel = (dateStr: string): string => {
  const today = getTodayLocalDateStr();
  if (dateStr === today) {
    return `Today • ${dateStr}`;
  }

  try {
    const todayDate = parseLocalDateStr(today);

    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatDateToLocalStr(yesterdayDate);

    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = formatDateToLocalStr(tomorrowDate);

    if (dateStr === yesterday) {
      return `Yesterday • ${dateStr}`;
    }
    if (dateStr === tomorrow) {
      return `Tomorrow • ${dateStr}`;
    }
  } catch {
    // Fallback if parsing fails
  }

  return dateStr;
};
