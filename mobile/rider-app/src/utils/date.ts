/**
 * Date utilities
 * Functions for handling dates, time calculations, etc.
 */

export const dateUtils = {
  /**
   * Add days to a date
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add hours to a date
   */
  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  /**
   * Add minutes to a date
   */
  addMinutes: (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  },

  /**
   * Check if date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },

  /**
   * Check if date is yesterday
   */
  isYesterday: (date: Date): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  },

  /**
   * Check if date is tomorrow
   */
  isTomorrow: (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  },

  /**
   * Get start of day
   */
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Get end of day
   */
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Check if two dates are the same day
   */
  isSameDay: (date1: Date, date2: Date): boolean => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  },

  /**
   * Get difference in days between two dates
   */
  getDaysDifference: (date1: Date, date2: Date): number => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  },

  /**
   * Get difference in minutes between two dates
   */
  getMinutesDifference: (date1: Date, date2: Date): number => {
    return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60)));
  },

  /**
   * Format date for API (ISO string)
   */
  toISOString: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * Parse ISO string to Date
   */
  fromISOString: (isoString: string): Date => {
    return new Date(isoString);
  },

  /**
   * Check if date is within range
   */
  isWithinRange: (date: Date, startDate: Date, endDate: Date): boolean => {
    return date >= startDate && date <= endDate;
  },

  /**
   * Get week day name
   */
  getWeekDayName: (date: Date): string => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[date.getDay()];
  },

  /**
   * Get month name
   */
  getMonthName: (date: Date): string => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[date.getMonth()];
  },

  /**
   * Check if date is weekend
   */
  isWeekend: (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  },

  /**
   * Get age from birth date
   */
  getAge: (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  },
};
