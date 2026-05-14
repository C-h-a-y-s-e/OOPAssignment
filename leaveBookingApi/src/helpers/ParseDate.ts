import { AppError } from './AppError';
import { StatusCodes } from 'http-status-codes';

export class ParseDate {
  static parseUkDate(dateString: string): Date {
    if (!dateString || typeof dateString !== 'string') {
      throw new AppError('Date must not be empty', StatusCodes.BAD_REQUEST);
    }

    const match = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/.exec(
      dateString,
    );
    if (!match) {
      throw new AppError(
        'Date must be in format DD/MM/YYYY, not exceeding days in a month',
        StatusCodes.BAD_REQUEST,
      );
    }

    const [, day, month, year] = match;
    const date = new Date(`${year}-${month}-${day}`);

    if (isNaN(date.getTime())) {
      throw new AppError('Invalid date', StatusCodes.BAD_REQUEST);
    }

    return date;
  }

  static parseRange(
    startDate: string,
    endDate: string,
  ): { startDate: Date; endDate: Date } {
    const parsedStartDate = ParseDate.parseUkDate(startDate);
    const parsedEndDate = ParseDate.parseUkDate(endDate);

    if (parsedStartDate > parsedEndDate) {
      throw new AppError(
        'Start date must be before or equal to end date',
        StatusCodes.BAD_REQUEST,
      );
    }

    return {
      startDate: parsedStartDate,
      endDate: parsedEndDate,
    };
  }

  static validateDateRange(
    startDate: string | Date,
    endDate: string | Date,
  ): void {
    const parsedStartDate =
      startDate instanceof Date ? startDate : ParseDate.parseUkDate(startDate);
    const parsedEndDate =
      endDate instanceof Date ? endDate : ParseDate.parseUkDate(endDate);

    if (parsedStartDate > parsedEndDate) {
      throw new AppError(
        'Start date must be before or equal to end date',
        StatusCodes.BAD_REQUEST,
      );
    }
  }

  static calculateDays(startDate: Date, endDate: Date): number {
    const msPerDay = 86400000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
  }

  static calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday or Saturday
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
