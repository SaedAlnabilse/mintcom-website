/**
 * Date period options and utilities for consistent date filtering across the application
 */

export type DatePeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'last_7_days'
  | 'last_28_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_12_months'
  | 'last_calendar_year'
  | 'this_year'
  | 'this_month'
  | 'last_30'
  | 'custom';

export interface DatePeriodOption {
  label: string;
  value: DatePeriod;
}

/**
 * All available date period options
 */
export const DATE_PERIOD_OPTIONS: DatePeriodOption[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week (Sun-Today)', value: 'this_week' },
  { label: 'Last Week (Sun-Sat)', value: 'last_week' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 28 Days', value: 'last_28_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'Last 90 Days', value: 'last_90_days' },
  { label: 'Last 12 Months', value: 'last_12_months' },
  { label: 'Last Calendar Year', value: 'last_calendar_year' },
  { label: 'This Year (Jan-Today)', value: 'this_year' },
];

/**
 * Get the label for a date period value
 */
export function getDatePeriodLabel(period: DatePeriod | string): string {
  const option = DATE_PERIOD_OPTIONS.find(opt => opt.value === period);
  return option?.label || 'Custom Range';
}

/**
 * Calculate the start and end dates for a given period
 * @param period The date period to calculate
 * @returns Object with start and end Date objects
 */
export function calculateDateRange(period: DatePeriod | string): { start: Date; end: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(today);
  let end = new Date(today);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case 'today':
      // Already set to today
      break;

    case 'yesterday':
      start.setDate(today.getDate() - 1);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      break;

    case 'this_week':
      // Sunday to Today
      const dayOfWeek = today.getDay(); // 0 = Sunday
      start.setDate(today.getDate() - dayOfWeek);
      break;

    case 'last_week':
      // Last Sunday to Last Saturday
      const currentDay = today.getDay();
      // Go back to last Saturday
      end = new Date(today);
      end.setDate(today.getDate() - currentDay - 1);
      end.setHours(23, 59, 59, 999);
      // Go back to last Sunday (7 days before last Saturday + 1)
      start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;

    case 'last_7_days':
      start.setDate(today.getDate() - 6); // Including today = 7 days
      break;

    case 'last_28_days':
      start.setDate(today.getDate() - 27); // Including today = 28 days
      break;

    case 'last_30_days':
    case 'last_30':
      start.setDate(today.getDate() - 29); // Including today = 30 days
      break;

    case 'last_90_days':
      start.setDate(today.getDate() - 89); // Including today = 90 days
      break;

    case 'last_12_months':
      start.setMonth(today.getMonth() - 12);
      start.setDate(1);
      break;

    case 'last_calendar_year':
      // Previous full calendar year (Jan 1 to Dec 31)
      start = new Date(today.getFullYear() - 1, 0, 1); // Jan 1 of last year
      end = new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999); // Dec 31 of last year
      break;

    case 'this_year':
      // January 1st to Today
      start = new Date(today.getFullYear(), 0, 1);
      break;

    case 'this_month':
      // First day of current month to Today
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;

    default:
      // Custom or unknown - return today's range
      break;
  }

  return { start, end };
}

/**
 * Format a date as YYYY-MM-DD string for input fields
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get formatted start and end date strings for a period
 */
export function getDateRangeStrings(period: DatePeriod | string): { startDate: string; endDate: string } {
  const { start, end } = calculateDateRange(period);
  return {
    startDate: formatDateForInput(start),
    endDate: formatDateForInput(end),
  };
}
