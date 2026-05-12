import { Request, Response } from 'express';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { Role } from '../entity/Roles';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import { IEntityController } from '../types/IEntityController';
import { AppError } from '../helpers/AppError';
export class RoleController implements IEntityController {
  constructor(private roleRepository: Repository<Role>) {}
  // Get all Roles
  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const roles = await this.roleRepository.find();
    if (roles.length === 0) {
      throw new AppError('No roles found', StatusCodes.NO_CONTENT);
    }
    ResponseHandler.sendSuccessResponse(res, roles);
  };
  public create = async (req: Request, res: Response): Promise<void> => {
    const role = new Role();
    role.name = req.body.name;
    const errors = await validate(role);
    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
        StatusCodes.BAD_REQUEST,
      );
    }
    const newRole = await this.roleRepository.save(role); // Save and return the created object
    ResponseHandler.sendSuccessResponse(res, newRole, StatusCodes.CREATED);
  };
  public delete = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      throw new AppError('No ID provided', StatusCodes.BAD_REQUEST);
    }
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) {
      throw new AppError('Role not found', StatusCodes.NOT_FOUND);
    }
    ResponseHandler.sendSuccessResponse(res, 'Role deleted');
  };
  public update = async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id as string);
    const name = req.body.name;
    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }
    const role = await this.roleRepository.findOneBy({ id });
    if (!role) {
      throw new AppError('Role not found', StatusCodes.NOT_FOUND);
    }
    // Update specific fields
    if (name !== undefined) role.name = name;
    const errors = await validate(role);
    if (errors.length > 0) {
      throw new AppError(
        errors.map((err) => Object.values(err.constraints || {})).join(', '),
        StatusCodes.BAD_REQUEST,
      );
    }
    const updatedRole = await this.roleRepository.save(role);
    ResponseHandler.sendSuccessResponse(res, updatedRole);
  };
  // Get Role by ID
  public getById = async (_req: Request, res: Response): Promise<void> => {
    const idParam = _req.params.id;
    const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam, 10);
    if (isNaN(id)) {
      throw new AppError('Invalid ID format', StatusCodes.BAD_REQUEST);
    }
    const role = await this.roleRepository.findOne({ where: { id: id } });
    if (!role) {
      throw new AppError(
        `Role not found with ID: ${id}`,
        StatusCodes.NOT_FOUND,
      );
    }
    ResponseHandler.sendSuccessResponse(res, role);
  };
}
