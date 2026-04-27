import { Request, Response } from 'express';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Role } from '../entity/Roles';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
export class RoleController {
  constructor(private roleRepository: Repository<Role>) {}
  // Get all Roles
  public getAll = async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await this.roleRepository.find();
      if (roles.length === 0) {
        ResponseHandler.sendErrorResponse(res, StatusCodes.NO_CONTENT);
        return;
      }
      ResponseHandler.sendSuccessResponse(res, roles);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve roles',
      );
    }
  };
  public create = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = new Role();
      role.name = req.body.name;
      const errors = await validate(role);
      if (errors.length > 0) {
        //Collate a string of all decorator error messages
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', '),
        );
      }
      const newRole = await this.roleRepository.save(role); // Save and return the created object
      ResponseHandler.sendSuccessResponse(res, newRole, StatusCodes.CREATED);
    } catch (error: any) {
      // Handle all possible error types (e.g. validation errors)
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
      if (!id) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          'No ID provided',
        );
        return;
      }
      const result = await this.roleRepository.delete(id);
      if (result.affected === 0) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          'Role not found',
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, 'Role deleted');
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
    const name = req.body.name;
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format',
      );
      return;
    }
    try {
      const role = await this.roleRepository.findOneBy({ id });
      if (!role) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          'Role not found',
        );
        return;
      }
      // Update specific fields
      if (name !== undefined) role.name = name;
      const errors = await validate(role);
      if (errors.length > 0) {
        //Collate a string of all decorator error messages
        throw new Error(
          errors.map((err) => Object.values(err.constraints || {})).join(', '),
        );
      }
      const updatedRole = await this.roleRepository.save(role);
      ResponseHandler.sendSuccessResponse(res, updatedRole);
    } catch (error: any) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        error.message,
      );
    }
  };
  // Get Role by ID
  public getById = async (_req: Request, res: Response): Promise<void> => {
    const idParam = _req.params.id;
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
    if (isNaN(id)) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Invalid ID format',
      );
      return;
    }
    try {
      const role = await this.roleRepository.findOne({ where: { id: id } });
      if (!role) {
        ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.NOT_FOUND,
          `Role not found with ID: ${id}`,
        );
        return;
      }
      ResponseHandler.sendSuccessResponse(res, role);
    } catch (error) {
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve role',
      );
    }
  };
}
