import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Repository } from 'typeorm';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { validate } from 'class-validator';
import { instanceToPlain } from 'class-transformer';
import Logger from '../helpers/Logger';
import { AppError } from '../helpers/AppError';
import { IEntityController } from '../types/IEntityController';
import { IGetByEmail } from '../types/IGetByEmail';
import { LeaveBalanceService } from '../services/LeaveBalanceService';

export class UserController implements IEntityController, IGetByEmail {
  constructor(private userRepository: Repository<User>) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    const users = await this.userRepository.find({
      relations: ['role'],
    });
    if (users.length === 0) {
      throw new AppError('No Content', StatusCodes.NO_CONTENT);
      return;
    }

    ResponseHandler.sendSuccessResponse(res, users);
  };

  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const emailParam = req.params.emailAddress;
    if (typeof emailParam !== 'string' || emailParam.trim().length === 0) {
      throw new AppError('Email is required', StatusCodes.BAD_REQUEST);
      return;
    }
    const email = emailParam.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email: email },
      relations: ['role'],
    });
    if (!user) {
      throw new AppError(`${email} not found`, StatusCodes.NOT_FOUND);
      return;
    }
    ResponseHandler.sendSuccessResponse(res, user);
  };
  public getById = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format',
      );
      return;
    }
    const user = await this.userRepository.findOne({
      where: { userId: id },
      relations: ['role'],
    });
    if (!user) {
      throw new AppError(
        `User not found with ID: ${id}`,
        StatusCodes.NO_CONTENT,
      );
      return;
    }
    ResponseHandler.sendSuccessResponse(res, user);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    Logger.info('UserController.create hit', req.body);
    const { firstname, surname, password, email, roleId } = req.body;
    var user = new User();
    user.firstname = firstname;
    user.surname = surname;
    user.password = password;
    user.email = email;
    user.role = { id: roleId } as any; //Assign role by ID, TypeORM will handle the relation
    const errors = await validate(user);
    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
      );
    }
    const newUser = await this.userRepository.save(user); // Save and return the created object
    ResponseHandler.sendSuccessResponse(
      res,
      instanceToPlain(newUser),
      StatusCodes.CREATED,
    );
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;

    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new AppError(
        `User with provided ID ${id} not found`,
        StatusCodes.NOT_FOUND,
      );
      return;
    }
    ResponseHandler.sendSuccessResponse(res, 'User deleted', StatusCodes.OK);
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const { email, password, roleId } = req.body;
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format',
      );
      return;
    }

    const user = await this.userRepository.findOneBy({ userId: id });
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
      return;
    }
    //Update specific fields
    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;
    if (roleId !== undefined) user.role = { id: Number(roleId) } as any;
    const errors = await validate(user, { skipMissingProperties: true });
    if (errors.length > 0) {
      //Collate a string of all decorator error messages
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
      );
    }
    const updatedUser = await this.userRepository.save(user);
    ResponseHandler.sendSuccessResponse(res, updatedUser, StatusCodes.OK);
  };

  public resetBalance = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.userId as string);

    if (isNaN(userId)) {
      throw new AppError('Invalid user ID format', StatusCodes.BAD_REQUEST);
    }

    await LeaveBalanceService.resetLeaveBalance(userId, this.userRepository);

    const user = await this.userRepository.findOne({
      where: { userId },
      relations: ['role'],
    });

    ResponseHandler.sendSuccessResponse(res, user);
  };
}
