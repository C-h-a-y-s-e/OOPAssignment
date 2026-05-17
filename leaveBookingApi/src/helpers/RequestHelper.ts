import { validate } from 'class-validator';
import { StatusCodes } from 'http-status-codes';
import { Repository } from 'typeorm';
import { AppError } from './AppError';
import { DateValidation } from './DateValidation';
import { ParseDate } from './ParseDate';
import { LeaveRequests } from '../entity/LeaveRequests';
import { LeaveTypes } from '../entity/LeaveTypes';
import { User } from '../entity/User';
import { LeaveBalanceService } from '../services/LeaveBalanceService';

export class RequestHelper {
  static parseId(idParam: string | string[]): number {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

    if (isNaN(id)) {
      throw new AppError(
        `Invalid ID format: ${Array.isArray(idParam) ? idParam[0] : idParam}`,
        StatusCodes.BAD_REQUEST,
      );
    }

    return id;
  }

  static normaliseStatus(status: unknown): LeaveRequests['status'] | undefined {
    return typeof status === 'string'
      ? (status.toLowerCase() as LeaveRequests['status'])
      : undefined;
  }

  static async getLeaveRequestById(
    idParam: string | string[],
    leaveRequestRepository: Repository<LeaveRequests>,
  ): Promise<LeaveRequests> {
    const id = this.parseId(idParam);

    const leaveRequest = await leaveRequestRepository.findOne({
      where: { id },
      relations: ['User'],
    });

    if (!leaveRequest) {
      throw new AppError(
        `Leave request not found with ID: ${id}`,
        StatusCodes.NOT_FOUND,
      );
    }

    return leaveRequest;
  }

  static async updateRequestDates(
    leaveRequest: LeaveRequests,
    startDate: unknown,
    endDate: unknown,
    leaveRequestRepository: Repository<LeaveRequests>,
  ): Promise<void> {
    const isStartDateString = typeof startDate === 'string';
    const isEndDateString = typeof endDate === 'string';

    if (isStartDateString && isEndDateString) {
      const parsedRange = ParseDate.parseRange(startDate, endDate);
      leaveRequest.startDate = parsedRange.startDate;
      leaveRequest.endDate = parsedRange.endDate;
    } else {
      if (isStartDateString) {
        leaveRequest.startDate = ParseDate.parseUkDate(startDate);
      }
      if (isEndDateString) {
        leaveRequest.endDate = ParseDate.parseUkDate(endDate);
      }
    }

    if (isStartDateString || isEndDateString) {
      await DateValidation.validateOverlap(
        leaveRequest.userId,
        leaveRequest.startDate,
        leaveRequest.endDate,
        leaveRequestRepository,
        leaveRequest.id,
      );
    }
  }

  static async restoreLeaveBalanceIfDenied(
    leaveRequest: LeaveRequests,
    previousStatus: LeaveRequests['status'],
    userRepository: Repository<User>,
  ): Promise<void> {
    if (previousStatus === 'denied' || leaveRequest.status !== 'denied') {
      return;
    }

    const startDate = new Date(leaveRequest.startDate);
    const endDate = new Date(leaveRequest.endDate);
    const daysToRestore = ParseDate.calculateDays(startDate, endDate);

    await LeaveBalanceService.restoreLeaveBalance(
      leaveRequest.userId,
      daysToRestore,
      userRepository,
    );
  }

  static applyRequestRelations(
    leaveRequest: LeaveRequests,
    userId: unknown,
    leaveTypeId: unknown,
  ): void {
    if (userId !== undefined) {
      leaveRequest.User = { userId } as User;
    }
    if (leaveTypeId !== undefined) {
      leaveRequest.leaveType = { id: leaveTypeId } as LeaveTypes;
    }
  }

  static async validateAndSaveRequest(
    leaveRequest: LeaveRequests,
    leaveRequestRepository: Repository<LeaveRequests>,
    statusCode: StatusCodes,
  ): Promise<LeaveRequests> {
    const errors = await validate(leaveRequest);

    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
        statusCode,
      );
    }

    return leaveRequestRepository.save(leaveRequest);
  }
}
