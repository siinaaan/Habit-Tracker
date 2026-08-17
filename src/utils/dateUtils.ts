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
