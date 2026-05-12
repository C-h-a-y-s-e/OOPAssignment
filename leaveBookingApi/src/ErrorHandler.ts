import { Response } from 'express';
import { Logger } from './helpers/Logger';
import { ResponseHandler } from './helpers/ResponseHandler';
import { AppError } from './helpers/AppError';
export class ErrorHandler {
  static handle(err: AppError, res: Response): void {
    Logger.error(err.message);
    ResponseHandler.sendErrorResponse(res, err.statusCode, err.message);
  }
}
