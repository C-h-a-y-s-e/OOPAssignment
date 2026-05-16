import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { UserManagement } from '../entity/UserManagement';
import { Repository } from 'typeorm';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '../helpers/AppError';
import { IEntityController } from '../types/IEntityController';
import { ParseDate } from '../helpers/ParseDate';

export class UserManagementController implements IEntityController {
  constructor(
    private userManagementRepository: Repository<UserManagement>,
    private userRepository: Repository<User>,
  ) {}

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const rows = await this.userManagementRepository.find({
      relations: ['User', 'Manager'],
    });
    if (rows.length === 0)
      throw new AppError(
        'No manager assignments found',
        StatusCodes.NO_CONTENT,
      );
    ResponseHandler.sendSuccessResponse(res, rows);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }
    const row = await this.userManagementRepository.findOne({
      where: { id },
      relations: ['User', 'Manager'],
    });
    if (!row)
      throw new AppError('Manager assignment not found', StatusCodes.NOT_FOUND);
    ResponseHandler.sendSuccessResponse(res, row);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const { userId, managerId, startDate, endDate } = req.body;
    if (userId === undefined || managerId === undefined) {
      throw new AppError(
        'userId and managerId are required',
        StatusCodes.BAD_REQUEST,
      );
    }

    const parsedUserId = Number(userId);
    const parsedManagerId = Number(managerId);
    if (isNaN(parsedUserId) || isNaN(parsedManagerId)) {
      throw new AppError(
        'userId and managerId must be numbers',
        StatusCodes.BAD_REQUEST,
      );
    }

    if (parsedUserId === parsedManagerId) {
      throw new AppError(
        'user cannot be their own manager',
        StatusCodes.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findOne({
      where: { userId: parsedUserId },
      relations: ['role'],
    });
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);

    const manager = await this.userRepository.findOne({
      where: { userId: parsedManagerId },
      relations: ['role'],
    });
    if (!manager)
      throw new AppError('Manager not found', StatusCodes.NOT_FOUND);

    if (user.roleId !== 1) {
      throw new AppError(
        'Manager assignment endpoint is only for roleId 1 users',
        StatusCodes.BAD_REQUEST,
      );
    }

    const existing = await this.userManagementRepository.findOne({
      where: {
        User: { userId: parsedUserId },
        Manager: { userId: parsedManagerId },
      },
      relations: ['User', 'Manager'],
    });
    if (existing)
      throw new AppError(
        'This user-manager assignment already exists',
        StatusCodes.CONFLICT,
      );

    const assignment = new UserManagement();
    assignment.User = user;
    assignment.Manager = manager;
    assignment.startDate =
      typeof startDate === 'string' && startDate.trim().length > 0
        ? ParseDate.parseUkDate(startDate)
        : ParseDate.parseUkDate('01/01/2026');
    assignment.endDate =
      typeof endDate === 'string' && endDate.trim().length > 0
        ? ParseDate.parseUkDate(endDate)
        : ParseDate.parseUkDate('31/12/2099');

    if (assignment.startDate > assignment.endDate) {
      throw new AppError(
        'startDate cannot be after endDate',
        StatusCodes.BAD_REQUEST,
      );
    }

    const saved = await this.userManagementRepository.save(assignment);
    const created = await this.userManagementRepository.findOne({
      where: { id: saved.id },
      relations: ['User', 'Manager'],
    });
    ResponseHandler.sendSuccessResponse(res, created, StatusCodes.CREATED);
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }
    const row = await this.userManagementRepository.findOne({
      where: { id },
      relations: ['User', 'Manager'],
    });
    if (!row)
      throw new AppError('Manager assignment not found', StatusCodes.NOT_FOUND);

    const { managerId, startDate, endDate } = req.body;

    if (managerId !== undefined) {
      const parsedManagerId = Number(managerId);
      if (isNaN(parsedManagerId))
        throw new AppError(
          'managerId must be a number',
          StatusCodes.BAD_REQUEST,
        );
      if (parsedManagerId === row.User.userId)
        throw new AppError(
          'user cannot be their own manager',
          StatusCodes.BAD_REQUEST,
        );

      const manager = await this.userRepository.findOne({
        where: { userId: parsedManagerId },
        relations: ['role'],
      });
      if (!manager)
        throw new AppError('Manager not found', StatusCodes.NOT_FOUND);
      row.Manager = manager;
    }

    if (startDate !== undefined) {
      if (typeof startDate !== 'string' || startDate.trim().length === 0) {
        throw new AppError('Invalid startDate format', StatusCodes.BAD_REQUEST);
      }
      row.startDate = ParseDate.parseUkDate(startDate);
    }

    if (endDate !== undefined) {
      if (typeof endDate !== 'string' || endDate.trim().length === 0) {
        throw new AppError('Invalid endDate format', StatusCodes.BAD_REQUEST);
      }
      row.endDate = ParseDate.parseUkDate(endDate);
    }

    if (row.startDate > row.endDate)
      throw new AppError(
        'startDate cannot be after endDate',
        StatusCodes.BAD_REQUEST,
      );

    const updated = await this.userManagementRepository.save(row);
    const withRelations = await this.userManagementRepository.findOne({
      where: { id: updated.id },
      relations: ['User', 'Manager'],
    });
    ResponseHandler.sendSuccessResponse(res, withRelations);
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }
    const result = await this.userManagementRepository.delete(id);
    if (result.affected === 0)
      throw new AppError('Manager assignment not found', StatusCodes.NOT_FOUND);
    ResponseHandler.sendSuccessResponse(res, 'Manager assignment deleted');
  };
}
