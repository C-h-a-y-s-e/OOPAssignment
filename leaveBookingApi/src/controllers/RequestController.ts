import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { IEntityController } from '../types/IEntityController';
import { IAuthenticatedJWTRequest } from '../types/IAuthenticatedJWTRequest';
import { RequestService } from '../services/RequestService';

export class RequestController implements IEntityController {
  constructor(private requestService: RequestService) {}

  public getAll = async (_req: Request, res: Response): Promise<void> => {
    const leaveRequests = await this.requestService.getAllLeaveRequests();
    ResponseHandler.sendSuccessResponse(res, leaveRequests);
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const leaveRequest = await this.requestService.getLeaveRequestById(
      req.params.id,
    );
    ResponseHandler.sendSuccessResponse(res, leaveRequest);
  };

  public getByUserId = async (req: Request, res: Response): Promise<void> => {
    const requests = await this.requestService.getRequestsForUser(
      req.params.userId,
    );
    ResponseHandler.sendSuccessResponse(res, requests);
  };

  public getForManager = async (req: Request, res: Response): Promise<void> => {
    const requests = await this.requestService.getRequestsForManager(
      req.params.userId,
    );
    ResponseHandler.sendSuccessResponse(res, requests);
  };

  public getLeaveBalance = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    const balance = await this.requestService.getLeaveBalance(
      req.params.userId,
    );
    ResponseHandler.sendSuccessResponse(res, balance);
  };

  public create = async (req: Request, res: Response): Promise<void> => {
    const newRequest = await this.requestService.createLeaveRequest(req.body);
    ResponseHandler.sendSuccessResponse(res, newRequest, StatusCodes.CREATED);
  };

  public update = async (
    req: IAuthenticatedJWTRequest,
    res: Response,
  ): Promise<void> => {
    const updatedRequest = await this.requestService.updateLeaveRequest(
      req,
      req.body,
    );
    ResponseHandler.sendSuccessResponse(res, updatedRequest);
  };

  public delete = async (
    req: IAuthenticatedJWTRequest,
    res: Response,
  ): Promise<void> => {
    await this.requestService.deleteLeaveRequest(req);

    ResponseHandler.sendSuccessResponse(res, 'Leave request cancelled');
  };

  public deleteAll = async (
    req: IAuthenticatedJWTRequest,
    res: Response,
  ): Promise<void> => {
    const message = await this.requestService.deleteAllLeaveRequests(req);
    ResponseHandler.sendSuccessResponse(res, message);
  };
}
