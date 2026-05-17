import { In, Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../helpers/AppError';
import { LeaveRequests } from '../entity/LeaveRequests';
import { User } from '../entity/User';
import { UserManagement } from '../entity/UserManagement';
import { ParseDate } from '../helpers/ParseDate';
import { LeaveBalanceService } from './LeaveBalanceService';
import { DateValidation } from '../helpers/DateValidation';
import { RequestHelper } from '../helpers/RequestHelper';
import { ensureCallerHasRoles } from '../helpers/RoleAuthorisation';
import { IAuthenticatedJWTRequest } from '../types/IAuthenticatedJWTRequest';

type LeaveRequestBody = {
  startDate?: unknown;
  endDate?: unknown;
  status?: unknown;
  userId?: unknown;
  leaveTypeId?: unknown;
};

export class RequestService {
  constructor(
    private leaveRequestRepository: Repository<LeaveRequests>,
    private userRepository: Repository<User>,
    private userManagementRepository: Repository<UserManagement>,
  ) {}

  public async getAllLeaveRequests(): Promise<LeaveRequests[]> {
    const leaveRequests = await this.leaveRequestRepository.find({
      relations: ['User'],
    });

    if (leaveRequests.length === 0) {
      throw new AppError('No leave requests found', StatusCodes.NO_CONTENT);
    }

    return leaveRequests;
  }

  public getLeaveRequestById(
    idParam: string | string[],
  ): Promise<LeaveRequests> {
    return RequestHelper.getLeaveRequestById(
      idParam,
      this.leaveRequestRepository,
    );
  }

  public async getRequestsForUser(
    userIdParam: string | string[],
  ): Promise<LeaveRequests[]> {
    const userId = RequestHelper.parseId(userIdParam);

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

    return requests;
  }

  public async getRequestsForManager(
    managerIdParam: string | string[],
  ): Promise<LeaveRequests[]> {
    const managerId = RequestHelper.parseId(managerIdParam);

    const managed = await this.userManagementRepository.find({
      relations: ['User', 'Manager'],
    });

    const managerAssignments = managed.filter(
      (assignment) => assignment.Manager?.userId === managerId,
    );

    if (managerAssignments.length === 0) {
      throw new AppError('No users found for manager', StatusCodes.NO_CONTENT);
    }

    const managedUserIds = managerAssignments.map(
      (assignment) => assignment.User.userId,
    );

    const requests = await this.leaveRequestRepository.find({
      where: { userId: In(managedUserIds) },
      relations: ['User'],
    });

    if (requests.length === 0) {
      throw new AppError(
        'No leave requests found for manager',
        StatusCodes.NO_CONTENT,
      );
    }

    return requests;
  }

  public async getLeaveBalance(
    userIdParam: string | string[],
  ): Promise<{ userId: number; leaveBalance: number }> {
    const userId = RequestHelper.parseId(userIdParam);
    const user = await this.userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    return { userId, leaveBalance: user.leaveBalance };
  }

  public async createLeaveRequest(
    body: LeaveRequestBody,
  ): Promise<LeaveRequests> {
    const leaveRequest = new LeaveRequests();
    const { startDate, endDate, status, userId, leaveTypeId } = body;

    if (userId === undefined || leaveTypeId === undefined) {
      throw new AppError(
        'userId and leaveTypeId are required',
        StatusCodes.BAD_REQUEST,
      );
    }

    const normalisedStatus = RequestHelper.normaliseStatus(status);
    const { startDate: parsedStartDate, endDate: parsedEndDate } =
      ParseDate.parseRange(startDate as string, endDate as string);

    await DateValidation.validateOverlap(
      RequestHelper.parseId(userId as string | string[]),
      parsedStartDate,
      parsedEndDate,
      this.leaveRequestRepository,
    );

    const daysRequested = ParseDate.calculateDays(
      parsedStartDate,
      parsedEndDate,
    );

    await LeaveBalanceService.checkAgainstBalance(
      RequestHelper.parseId(userId as string | string[]),
      daysRequested,
      this.userRepository,
    );

    leaveRequest.startDate = parsedStartDate;
    leaveRequest.endDate = parsedEndDate;

    if (normalisedStatus !== undefined) {
      leaveRequest.status = normalisedStatus as any;
    }

    RequestHelper.applyRequestRelations(leaveRequest, userId, leaveTypeId);

    return RequestHelper.validateAndSaveRequest(
      leaveRequest,
      this.leaveRequestRepository,
      StatusCodes.BAD_REQUEST,
    );
  }

  public async updateLeaveRequest(
    req: IAuthenticatedJWTRequest,
    body: LeaveRequestBody,
  ): Promise<LeaveRequests> {
    await ensureCallerHasRoles(
      this.userRepository,
      req.signedInUser?.email,
      ['admin', 'manager'],
      'Only admins and managers may update leave requests',
    );

    const leaveRequest = await this.getLeaveRequestById(req.params.id);
    const { startDate, endDate, status, userId, leaveTypeId } = body;
    const previousStatus = leaveRequest.status;

    await RequestHelper.updateRequestDates(
      leaveRequest,
      startDate,
      endDate,
      this.leaveRequestRepository,
    );

    leaveRequest.status =
      RequestHelper.normaliseStatus(status) ?? leaveRequest.status;

    await RequestHelper.restoreLeaveBalanceIfDenied(
      leaveRequest,
      previousStatus,
      this.userRepository,
    );

    RequestHelper.applyRequestRelations(leaveRequest, userId, leaveTypeId);

    return RequestHelper.validateAndSaveRequest(
      leaveRequest,
      this.leaveRequestRepository,
      StatusCodes.BAD_REQUEST,
    );
  }

  public async deleteLeaveRequest(
    req: IAuthenticatedJWTRequest,
  ): Promise<void> {
    const id = RequestHelper.parseId(req.params.id);

    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['User'],
    });

    if (!leaveRequest) {
      throw new AppError('Leave request not found', StatusCodes.NOT_FOUND);
    }

    const isRequestOwner = leaveRequest.User?.email === req.signedInUser?.email;
    const isAdmin = req.signedInUser?.role?.name === 'admin';

    if (!isRequestOwner && !isAdmin) {
      throw new AppError(
        'You do not have permission to cancel this leave request',
        StatusCodes.FORBIDDEN,
      );
    }

    if (
      leaveRequest.status === 'approved' ||
      leaveRequest.status === 'pending'
    ) {
      const startDate = new Date(leaveRequest.startDate);
      const endDate = new Date(leaveRequest.endDate);
      const daysToRestore = ParseDate.calculateDays(startDate, endDate);

      await LeaveBalanceService.restoreLeaveBalance(
        leaveRequest.userId,
        daysToRestore,
        this.userRepository,
      );
    }

    const result = await this.leaveRequestRepository.delete(id);

    if (result.affected === 0) {
      throw new AppError('Leave request not found', StatusCodes.NOT_FOUND);
    }
  }

  public async deleteAllLeaveRequests(
    req: IAuthenticatedJWTRequest,
  ): Promise<string> {
    if (req.signedInUser?.role?.name !== 'admin') {
      throw new AppError(
        'You do not have permission to delete all leave requests',
        StatusCodes.FORBIDDEN,
      );
    }

    const result = await this.leaveRequestRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return `Deleted ${result.affected} leave requests`;
  }
}
