import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatBTC(amount: number | null, includeSuffix: boolean = false): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  }).format(amount) + (includeSuffix ? " BTC" : "")
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100)
}

export function formatDateLong(dateString: string | Date | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const day = date.getDate();
    const year = date.getFullYear();

    const getDayWithSuffix = (d: number) => {
      if (d > 3 && d < 21) return d + 'th';
      switch (d % 10) {
        case 1:  return d + "st";
        case 2:  return d + "nd";
        case 3:  return d + "rd";
        default: return d + "th";
      }
    };

    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[date.getMonth()];
    const dayWithSuffix = getDayWithSuffix(day);

    return `${monthName} ${dayWithSuffix} ${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
}

/**
 * Calculates and formats the time remaining between two dates.
 * 
 * @param targetDate - The target/end date (can be string, Date object, or null/undefined)
 * @param startDate - The start date (defaults to current date)
 * @param format - The output format: 'short' for basic text, 'long' for detailed text with "left" suffix
 * @returns Formatted string representing time remaining
 */
export function calculateTimeRemaining(
  targetDate: string | Date | null | undefined, 
  startDate: Date = new Date(),
  format: 'short' | 'long' = 'long'
): string {
  // Handle invalid input cases
  if (!targetDate) return format === 'short' ? 'N/A' : '';
  
  try {
    const endDate = new Date(targetDate);
    
    // Check for invalid date
    if (isNaN(endDate.getTime()) || isNaN(startDate.getTime())) {
      return format === 'short' ? 'N/A' : '';
    }
    
    // Check if target date is in the past
    if (endDate < startDate) {
      return format === 'short' ? 'Complete' : 'Goal complete';
    }
    
    // Calculate difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();
    
    // Convert to days, months, years
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // For days less than a month
    if (diffDays < 30) {
      const suffix = format === 'long' ? ' left' : '';
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`;
    }
    
    // For months less than a year
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      const suffix = format === 'long' ? ' left' : '';
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''}${suffix}`;
    }
    
    // For years and months
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    
    // If exact years with no remaining months
    if (remainingMonths === 0) {
      const suffix = format === 'long' ? ' left' : '';
      return `${years} year${years !== 1 ? 's' : ''}${suffix}`;
    }
    
    // Years and months format
    if (format === 'short') {
      return `${years}y ${remainingMonths}m`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''} left`;
    }
  } catch (error) {
    console.error("Error calculating time remaining:", error);
    return format === 'short' ? 'Error' : '';
  }
}
