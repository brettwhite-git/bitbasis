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
