/**
 * Shared date and time utility functions for calculator components
 */

/**
 * Gets duration details from a string identifier
 */
export const getDurationDetails = (duration: string): { months: number, years: number, label: string } => {
  switch (duration) {
    case '1_month': return { months: 1, years: 1/12, label: '1 Month' };
    case '3_month': return { months: 3, years: 0.25, label: '3 Months' };
    case '6_month': return { months: 6, years: 0.5, label: '6 Months' };
    case '2_year': return { months: 24, years: 2, label: '2 Years' };
    case '3_year': return { months: 36, years: 3, label: '3 Years' };
    case '4_year': return { months: 48, years: 4, label: '4 Years' };
    case '5_year': return { months: 60, years: 5, label: '5 Years' };
    case '10_year': return { months: 120, years: 10, label: '10 Years' };
    case '1_year':
    default: return { months: 12, years: 1, label: '1 Year' };
  }
};

/**
 * Gets frequency details from a string identifier
 */
export const getFrequencyDetails = (frequency: string): { periodsPerYear: number, label: string } => {
  switch (frequency) {
    case 'daily': return { periodsPerYear: 365, label: 'Daily' };
    case 'monthly': return { periodsPerYear: 12, label: 'Monthly' };
    case 'yearly': return { periodsPerYear: 1, label: 'Yearly' };
    case 'weekly':
    default: return { periodsPerYear: 52, label: 'Weekly' };
  }
};

/**
 * Adds time periods to a date based on frequency
 */
export const addPeriods = (date: Date, frequency: string, count: number): Date => {
  const newDate = new Date(date);
  switch (frequency) {
    case 'daily': newDate.setDate(date.getDate() + count); break;
    case 'weekly': newDate.setDate(date.getDate() + count * 7); break;
    case 'monthly': newDate.setMonth(date.getMonth() + count); break;
    case 'yearly': newDate.setFullYear(date.getFullYear() + count); break;
  }
  return newDate;
};

/**
 * Formats a date for display in chart labels based on frequency
 */
export const formatDateLabel = (date: Date, frequency: string, totalPeriods: number): string => {
  // Always include year for clarity, adjust day presence based on frequency/duration
  const options: Intl.DateTimeFormatOptions = { month: 'short' }; // Start with month only

  // Always show day for daily frequency
  if (frequency === 'daily') {
    options.day = 'numeric';
  } 
  // Show day for weekly only if duration is <= 2 years
  else if (frequency === 'weekly' && totalPeriods <= 52 * 2) {
    options.day = 'numeric';
  } 
  // Monthly/Yearly usually don't need the day part in labels

  // Format month and potentially day
  const monthDayPart = date.toLocaleDateString('en-US', options);

  // Get 2-digit year and add apostrophe
  const yearPart = `'${date.getFullYear().toString().slice(-2)}`;

  // Combine parts
  return `${monthDayPart}${options.day ? ',' : ''} ${yearPart}`; // Add comma only if day is present
};

/**
 * Formats a date for HTML date input field (YYYY-MM-DD)
 */
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; 