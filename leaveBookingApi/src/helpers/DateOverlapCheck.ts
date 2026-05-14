import { Repository } from 'typeorm';
import { LeaveRequests } from '../entity/LeaveRequests';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';
export class DateOverlapCheck {
  static async checkOverlap(
    userId: number,
    newStart: Date,
    newEnd: Date,
    leaveRequestRepository: Repository<LeaveRequests>,
    excludeRequestId?: number,
  ): Promise<boolean> {
    const allRequests = await leaveRequestRepository.find({
      relations: ['User'],
    });
    const existingRequests = allRequests.filter(
      (request) => request.User?.userId === userId,
    );

    for (const request of existingRequests) {
      if (excludeRequestId !== undefined && request.id === excludeRequestId) {
        continue;
      }

      if (request.startDate <= newEnd && request.endDate >= newStart) {
        return true;
      }
    }

    return false;
  }
  static async validateOverlap(
    userId: number,
    newStart: Date,
    newEnd: Date,
    leaveRequestRepository: Repository<LeaveRequests>,
    excludeRequestId?: number,
  ): Promise<void> {
    const hasOverlap = await this.checkOverlap(
      userId,
      newStart,
      newEnd,
      leaveRequestRepository,
      excludeRequestId,
    );

    if (hasOverlap) {
      throw new AppError(
        'Requested dates overlap with another leave request',
        StatusCodes.BAD_REQUEST,
      );
    }
  }
}
