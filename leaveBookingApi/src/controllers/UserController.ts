import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import { Repository } from 'typeorm';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import { validate } from 'class-validator';
import { instanceToPlain } from 'class-transformer';

export class UserController {
  constructor(private userRepository: Repository<User>) {}

  public getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userRepository.find({
        relations: ['role'],
      });
      if (users.length === 0) {
        ResponseHandler.sendSuccessResponse(res, StatusCodes.NO_CONTENT);
        return;
      }

      ResponseHandler.sendSuccessResponse(res, users);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Failed to retrieve users: ${error.message}`,
      );
    }
  };
  public getByEmail = async (req: Request, res: Response): Promise<void> => {
    const emailParam = req.params.emailAddress;
    if (typeof emailParam !== 'string' || emailParam.trim().length === 0) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Email is required',
      );
      return;
    }
    const email = emailParam.trim().toLowerCase();
    try {
      const user = await this.userRepository.findOne({
        where: { email: email },
        relations: ['role'],
      });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          `${email} not found`,
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Unable to find user with the email: {email}`,
      );
    }
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
    try {
      const user = await this.userRepository.findOne({
        where: { userId: id },
        relations: ['role'],
      });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NO_CONTENT,
          `User not found with ID: ${id}`,
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, user);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        `Error fetching user: {$error.message}`,
      );
    }
  };
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { firstname, surname, password, email, roleId } = req.body;
      var user = new User();
      user.firstname = firstname;
      user.surname = surname;
      user.password = password; //Will be salted and hashed in the entity
      user.email = email;
      user.role = { id: roleId } as any; //Assign role by ID, TypeORM will handle the relation
      const errors = await validate(user);
      if (errors.length > 0) {
        //Collate a string of all decorator error messages
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', '),
        );
      }
      const newUser = await this.userRepository.save(user); // Save and return the created object
      ResponseHandler.sendSuccessResponse(
        res,
        instanceToPlain(newUser),
        StatusCodes.CREATED,
      );
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message,
      );
    }
  };
  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
      //Might consider softDelete (mark as deleted) in a production app to enable data recovery
      //If we do this we can add @DeleteDateColumn() deletedAt?: Date;
      const result = await this.userRepository.delete(id);
      if (result.affected === 0) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          `User with provided ID ${id} not found`,
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, 'User deleted', StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        error.message,
      );
    }
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
    try {
      const user = await this.userRepository.findOneBy({ userId: id });
      if (!user) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          'User not found',
        );
        return;
      }
      //Update specific fields
      if (email !== undefined) user.email = email;
      if (password !== undefined) user.password = password;
      if (roleId !== undefined) user.role = { id: roleId } as any;
      const errors = await validate(user);
      if (errors.length > 0) {
        //Collate a string of all decorator error messages
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', '),
        );
      }
      const updatedUser = await this.userRepository.save(user);
      ResponseHandler.sendSuccessResponse(res, updatedUser, StatusCodes.OK);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message,
      );
    }
  };
}
