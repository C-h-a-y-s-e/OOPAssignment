import { Request, Response } from 'express';
import { IAuthenticatedJWTRequest } from './IAuthenticatedJWTRequest';
import { IEntityController } from './IEntityController';

export interface IRequestController extends IEntityController {
  getByUserId(req: Request, res: Response): Promise<void>;
  getForManager(req: Request, res: Response): Promise<void>;
  deleteAll(req: IAuthenticatedJWTRequest, res: Response): Promise<void>;
  getLeaveBalance(req: Request, res: Response): Promise<void>;
}
