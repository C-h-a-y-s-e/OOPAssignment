import { In, Repository } from 'typeorm';
import { LeaveRequests } from '../entity/LeaveRequests';
import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError';
import Logger from './Logger';
import { validate } from 'class-validator';
import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { LeaveTypes } from '../entity/LeaveTypes';
import { User } from '../entity/User';
import { UserManagement } from '../entity/UserManagement';
import { IEntityController } from '../types/IEntityController';
import { ParseDate } from './ParseDate';
import { ResponseHandler } from './ResponseHandler';
export class DateValidation {
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

    Logger.debug(
      `DateOverlapCheck: found ${existingRequests.length} requests for user ${userId}`,
    );

    for (const request of existingRequests) {
      if (excludeRequestId !== undefined && request.id === excludeRequestId) {
        continue;
      }

      const existingStart =
        request.startDate instanceof Date
          ? request.startDate.getTime()
          : new Date(request.startDate).getTime();
      const existingEnd =
        request.endDate instanceof Date
          ? request.endDate.getTime()
          : new Date(request.endDate).getTime();
      const newStartTime =
        newStart instanceof Date
          ? newStart.getTime()
          : new Date(newStart).getTime();
      const newEndTime =
        newEnd instanceof Date ? newEnd.getTime() : new Date(newEnd).getTime();

      Logger.debug(
        `Checking overlap: existing ${existingStart}-${existingEnd} new ${newStartTime}-${newEndTime}`,
      );

      if (existingStart <= newEndTime && existingEnd >= newStartTime) {
        Logger.debug(`Overlap detected with request id ${request.id}`);
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
export class RequestController implements IEntityController {
  constructor(private leaveRequestRepository: Repository<LeaveRequests>) {}

  private parseId(idParam: string | string[]): number {
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);

    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }

    return id;
  }

  private async getLeaveRequestById(
    idParam: string | string[],
  ): Promise<LeaveRequests> {
    const id = this.parseId(idParam);

    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['User', 'leaveType'],
    });

    if (!leaveRequest) {
      throw new AppError(
        `Leave request not found with ID: ${id}`,
        StatusCodes.NOT_FOUND,
      );
    }

    return leaveRequest;
  }

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const leaveRequests = await this.leaveRequestRepository.find({
      relations: ['User', 'leaveType'],
    });

    if (leaveRequests.length === 0) {
      throw new AppError('No leave requests found', StatusCodes.NO_CONTENT);
    }

    ResponseHandler.sendSuccessResponse(res, leaveRequests);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const leaveRequest = await this.getLeaveRequestById(req.params.id);
    ResponseHandler.sendSuccessResponse(res, leaveRequest);
  };

  //  return leave requests for a specific user
  public getByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = this.parseId(req.params.userId);

    const requests = await this.leaveRequestRepository.find({
      where: { userId },
      relations: ['User', 'leaveType'],
    });

    if (requests.length === 0) {
      throw new AppError(
        'No leave requests found for user',
        StatusCodes.NO_CONTENT,
      );
    }

    ResponseHandler.sendSuccessResponse(res, requests);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const leaveRequest = new LeaveRequests();
    const { startDate, endDate, status, userId, leaveTypeId } = req.body;
    const normalisedStatus = status.toLowerCase();
    if (userId === undefined || leaveTypeId === undefined) {
      throw new AppError(
        'userId and leaveTypeId are required',
        StatusCodes.BAD_REQUEST,
      );
    }

    // Set the start and end date to a Date variable, parsed into the correct format
    const { startDate: parsedStartDate, endDate: parsedEndDate } =
      ParseDate.parseRange(startDate, endDate);

    await DateValidation.validateOverlap(
      userId,
      parsedStartDate,
      parsedEndDate,
      this.leaveRequestRepository,
    ); //Use excludeRequestId when patching or updating
    leaveRequest.startDate = parsedStartDate;
    leaveRequest.endDate = parsedEndDate;

    if (normalisedStatus !== undefined) {
      leaveRequest.status = normalisedStatus;
    }
    leaveRequest.User = { userId } as User;
    (leaveRequest as any).leaveType = { id: leaveTypeId } as LeaveTypes;

    const errors = await validate(leaveRequest);
    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
        StatusCodes.BAD_REQUEST,
      );
    }

    const newRequest = await this.leaveRequestRepository.save(leaveRequest);
    ResponseHandler.sendSuccessResponse(res, newRequest, StatusCodes.CREATED);
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const leaveRequest = await this.getLeaveRequestById(req.params.id);
    const { startDate, endDate, status, userId, leaveTypeId } = req.body;
    const normalisedStatus = status?.toLowerCase;
    if (startDate !== undefined) {
      leaveRequest.startDate = ParseDate.parseUkDate(startDate);
    }
    if (endDate !== undefined) {
      leaveRequest.endDate = ParseDate.parseUkDate(endDate);
    }
    if (startDate !== undefined && endDate !== undefined) {
      ParseDate.parseRange(startDate, endDate);
    }
    if (normalisedStatus !== undefined) {
      leaveRequest.status = normalisedStatus;
    }
    if (userId !== undefined) leaveRequest.User = { userId } as User;
    if (leaveTypeId !== undefined)
      (leaveRequest as any).leaveType = { id: leaveTypeId } as LeaveTypes;

    const errors = await validate(leaveRequest);
    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
        StatusCodes.BAD_REQUEST,
      );
    }

    const updatedRequest = await this.leaveRequestRepository.save(leaveRequest);
    ResponseHandler.sendSuccessResponse(res, updatedRequest);
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = this.parseId(req.params.id);
    const result = await this.leaveRequestRepository.delete(id);

    if (result.affected === 0) {
      throw new AppError('Leave request not found', StatusCodes.NOT_FOUND);
    }

    ResponseHandler.sendSuccessResponse(res, 'Leave request deleted');
  };
}
