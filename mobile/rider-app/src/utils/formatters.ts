/**
 * Formatting utilities
 * Functions to format dates, numbers, currency, etc.
 */

export const formatters = {
  /**
   * Format currency amount
   */
  currency: (amount: number, currency = 'INR'): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format number with commas
   */
  number: (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
  },

  /**
   * Format date to readable string
   */
  date: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  /**
   * Format time to readable string
   */
  time: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Format date and time together
   */
  dateTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  relativeTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return formatters.date(d);
  },

  /**
   * Format phone number
   */
  phone: (phone: string): string => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format Indian phone numbers
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const number = cleaned.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('091')) {
      const number = cleaned.slice(3);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }

    return phone;
  },

  /**
   * Format distance in km or meters
   */
  distance: (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  },

  /**
   * Format duration in minutes to readable format
   */
  duration: (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
  },

  /**
   * Capitalize first letter of each word
   */
  capitalize: (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  },
};
