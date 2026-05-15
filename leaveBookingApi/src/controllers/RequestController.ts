import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { Repository, In } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { AppError } from '../helpers/AppError';
import { IEntityController } from '../types/IEntityController';
import { LeaveRequests } from '../entity/LeaveRequests';
import { LeaveTypes } from '../entity/LeaveTypes';
import { User } from '../entity/User';
import { AppDataSource } from '../data-source';
import { UserManagement } from '../entity/UserManagement';
import { ParseDate } from '../helpers/ParseDate';
import { LeaveBalanceService } from '../services/LeaveBalanceService';
import { DateValidation } from '../helpers/DateValidation';

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

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const leaveRequests = await this.leaveRequestRepository.find({
      relations: ['User'],
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

  public getByUserId = async (req: Request, res: Response): Promise<void> => {
    const userId = this.parseId(req.params.userId);

    const requests = await this.leaveRequestRepository.find({
      where: { userId },
      relations: ['User'],
    });

    if (requests.length === 0) {
      throw new AppError(
        'No leave requests found for user',
        StatusCodes.NO_CONTENT,
      );
    }

    ResponseHandler.sendSuccessResponse(res, requests);
  };

  public getForManager = async (req: Request, res: Response): Promise<void> => {
    const managerId = this.parseId(req.params.managerId);

    const userManagementRepo = AppDataSource.getRepository(UserManagement);
    const managed = await userManagementRepo.find({
      where: { manager_id: managerId },
    });

    if (managed.length === 0) {
      throw new AppError('No users found for manager', StatusCodes.NO_CONTENT);
    }

    const userIds = managed.map((m) => m.user_id);

    const requests = await this.leaveRequestRepository.find({
      where: { userId: In(userIds) },
      relations: ['User'],
    });

    if (requests.length === 0) {
      throw new AppError(
        'No leave requests found for manager',
        StatusCodes.NO_CONTENT,
      );
    }

    ResponseHandler.sendSuccessResponse(res, requests);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const leaveRequest = new LeaveRequests();
    const { startDate, endDate, status, userId, leaveTypeId } = req.body;

    if (userId === undefined || leaveTypeId === undefined) {
      throw new AppError(
        'userId and leaveTypeId are required',
        StatusCodes.BAD_REQUEST,
      );
    }

    const normalisedStatus =
      typeof status === 'string' ? status.toLowerCase() : undefined;

    const { startDate: parsedStartDate, endDate: parsedEndDate } =
      ParseDate.parseRange(startDate, endDate);

    await DateValidation.validateOverlap(
      userId,
      parsedStartDate,
      parsedEndDate,
      this.leaveRequestRepository,
    );

    const daysRequested = ParseDate.calculateDays(
      parsedStartDate,
      parsedEndDate,
    );
    const userRepo = AppDataSource.getRepository(User);
    await LeaveBalanceService.checkAgainstBalance(
      userId,
      daysRequested,
      userRepo,
    );

    leaveRequest.startDate = parsedStartDate;
    leaveRequest.endDate = parsedEndDate;
    if (normalisedStatus !== undefined) {
      leaveRequest.status = normalisedStatus as any;
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
    const normalisedStatus =
      typeof status === 'string' ? status.toLowerCase() : undefined;
    const previousStatus = leaveRequest.status;

    if (startDate !== undefined && endDate !== undefined) {
      const parsedRange = ParseDate.parseRange(startDate, endDate);
      leaveRequest.startDate = parsedRange.startDate;
      leaveRequest.endDate = parsedRange.endDate;
    } else {
      if (startDate !== undefined) {
        leaveRequest.startDate = ParseDate.parseUkDate(startDate);
      }
      if (endDate !== undefined) {
        leaveRequest.endDate = ParseDate.parseUkDate(endDate);
      }
    }

    if (startDate !== undefined || endDate !== undefined) {
      await DateValidation.validateOverlap(
        leaveRequest.userId,
        leaveRequest.startDate,
        leaveRequest.endDate,
        this.leaveRequestRepository,
        leaveRequest.id,
      );
    }

    if (normalisedStatus !== undefined) {
      leaveRequest.status = normalisedStatus as any;
    }

    if (previousStatus !== 'denied' && leaveRequest.status === 'denied') {
      const daysToRestore = ParseDate.calculateDays(
        leaveRequest.startDate,
        leaveRequest.endDate,
      );
      const userRepo = AppDataSource.getRepository(User);
      await LeaveBalanceService.restoreLeaveBalance(
        leaveRequest.userId,
        daysToRestore,
        userRepo,
      );
    }

    if (userId !== undefined) leaveRequest.User = { userId } as User;
    if (leaveTypeId !== undefined) {
      (leaveRequest as any).leaveType = { id: leaveTypeId } as LeaveTypes;
    }

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

  public deleteAll = async (req: Request, res: Response): Promise<void> => {
    const result = await this.leaveRequestRepository
      .createQueryBuilder() //allows for empty criteria when making delete request
      .delete()
      .execute();
    ResponseHandler.sendSuccessResponse(
      res,
      `Deleted ${result.affected} leave requests`,
    );
  };
}
