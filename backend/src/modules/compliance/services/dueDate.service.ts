import { IComplianceFilingType } from '../compliance.model';

/**
 * Service for computing statutory and internal due dates for compliance filings.
 */
class DueDateService {
  /**
   * Get the last working day (Mon-Fri) of a given month
   */
  private getLastWorkingDay(year: number, month: number): Date {
    // month is 1-indexed (1-12), Date constructor uses 0-indexed months
    // Get last day of the month
    const lastDayOfMonth = new Date(year, month, 0); // day 0 = last day of previous month
    let lastDay = new Date(lastDayOfMonth);
    
    // Go backwards to find last weekday (Mon-Fri)
    while (lastDay.getDay() === 0 || lastDay.getDay() === 6) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    
    return lastDay;
  }

  /**
   * Compute statutory due date based on filing type rule
   */
  async computeStatutoryDueDate(
    filingType: IComplianceFilingType,
    year: number,
    month: number
  ): Promise<Date> {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    switch (filingType.dueDateRule) {
      case 'LAST_WORKING_DAY_NEXT_MONTH':
        return this.getLastWorkingDay(nextYear, nextMonth);

      case 'LAST_DAY_NEXT_MONTH':
        // Last calendar day of next month
        return new Date(nextYear, nextMonth, 0);

      case 'FIXED_DAY_NEXT_MONTH':
        // Use internalDueDayOfMonth if set, otherwise default to 15th
        const day = filingType.internalDueDayOfMonth || 15;
        const daysInMonth = new Date(nextYear, nextMonth, 0).getDate();
        const clampedDay = Math.min(day, daysInMonth);
        return new Date(nextYear, nextMonth - 1, clampedDay);

      default:
        // Fallback to last working day
        return this.getLastWorkingDay(nextYear, nextMonth);
    }
  }

  /**
   * Compute internal due date (for early action)
   */
  async computeInternalDueDate(
    filingType: IComplianceFilingType,
    year: number,
    month: number
  ): Promise<Date | null> {
    if (!filingType.internalDueDayOfMonth) {
      return null;
    }

    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const day = filingType.internalDueDayOfMonth;
    const daysInMonth = new Date(nextYear, nextMonth, 0).getDate();
    const clampedDay = Math.min(day, daysInMonth);

    return new Date(nextYear, nextMonth - 1, clampedDay);
  }
}

export const dueDateService = new DueDateService();
