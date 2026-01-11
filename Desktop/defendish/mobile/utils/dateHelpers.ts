/**
 * Date Helper Utilities
 * Functions for formatting dates and times in user-friendly ways
 */

/**
 * Get time-based greeting
 * @returns Greeting string based on current time
 */
export function formatGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'Good morning';
  } else if (hour < 18) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Format current date nicely
 * @returns Formatted date string (e.g., "Friday, January 3, 2026")
 */
export function getCurrentDateFormatted(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return now.toLocaleDateString('en-US', options);
}

/**
 * Calculate days until a date
 * @param dateString - Date string (ISO format)
 * @returns Number of days until date (can be negative if past)
 */
export function getDaysUntilExpiry(dateString: string | null): number {
  if (!dateString) return Infinity;
  
  const now = new Date();
  const expiryDate = new Date(dateString);
  
  // Reset time to midnight for accurate day calculation
  now.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Format expiry countdown message
 * @param dateString - Expiry date string
 * @returns User-friendly countdown message
 */
export function formatExpiryCountdown(dateString: string | null): string {
  if (!dateString) return 'No expiry date';
  
  const days = getDaysUntilExpiry(dateString);
  
  if (days < 0) {
    const absDays = Math.abs(days);
    return absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`;
  } else if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return 'Expires tomorrow';
  } else if (days <= 7) {
    return `Expires in ${days} days`;
  } else if (days <= 30) {
    const weeks = Math.ceil(days / 7);
    return `Expires in ${weeks} week${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.ceil(days / 30);
    return `Expires in ${months} month${months > 1 ? 's' : ''}`;
  }
}

/**
 * Get urgency color based on days until expiry
 * @param dateString - Expiry date string
 * @returns Color code ('red', 'orange', 'yellow', 'green')
 */
export function getExpiryUrgencyColor(dateString: string | null): string {
  if (!dateString) return '#9ca3af'; // Gray for no expiry
  
  const days = getDaysUntilExpiry(dateString);
  
  if (days < 0) return '#dc2626'; // Red - expired
  if (days <= 2) return '#dc2626'; // Red - critical (0-2 days)
  if (days <= 5) return '#f97316'; // Orange - warning (3-5 days)
  if (days <= 7) return '#eab308'; // Yellow - caution (6-7 days)
  return '#10b981'; // Green - safe
}

/**
 * Format relative date (e.g., "2 days ago", "Just now")
 * @param dateString - Date string (ISO format)
 * @returns Relative time string
 */
export function formatRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format date in short format
 * @param dateString - Date string (ISO format)
 * @returns Short date string (e.g., "Jan 3, 2026")
 */
export function formatShortDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Check if date is today
 * @param dateString - Date string (ISO format)
 * @returns True if date is today
 */
export function isToday(dateString: string): boolean {
  const today = new Date();
  const date = new Date(dateString);
  
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
}

/**
 * Check if date is within next N days
 * @param dateString - Date string (ISO format)
 * @param days - Number of days to check
 * @returns True if date is within next N days
 */
export function isWithinDays(dateString: string | null, days: number): boolean {
  if (!dateString) return false;
  
  const daysUntil = getDaysUntilExpiry(dateString);
  return daysUntil >= 0 && daysUntil <= days;
}
