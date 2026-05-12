import { StatusCodes } from 'http-status-codes';
export class AppError extends Error {
  public statusCode: number;
  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
