import express, { Response, NextFunction } from 'express';
import requestIP, { rateLimit } from 'express-rate-limit';
import { IAuthenticatedJWTRequest } from '../types/IAuthenticatedJWTRequest';
import { Logger } from '../helpers/Logger';
import { ResponseHandler } from '../helpers/ResponseHandler';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { Server } from '../Server';
export class MiddlewareFactory {
  public static readonly TOO_MANY_REQUESTS_MESSAGE =
    'Too many requests - try again later';
  static readonly loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100, //Maximum requests per window
    message: MiddlewareFactory.TOO_MANY_REQUESTS_MESSAGE,
    standardHeaders: true, //Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, //Disable the X-RateLimit-* headers
  });
  static readonly jwtRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 20, //Maximum requests per window
    message: MiddlewareFactory.TOO_MANY_REQUESTS_MESSAGE,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      return req.signedInUser?.email || requestIP(req);
    },
  });
  static logRouteAccess(route: string) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      Logger.info(`${route} accessed by ${req.ip}`);
      next();
    };
  }
  static authenticateToken = (
    req: IAuthenticatedJWTRequest,
    res: Response,
    next: NextFunction,
  ) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const tokenReceived = authHeader.split(' ')[1];
      if (!process.env.JWT_SECRET_KEY) {
        Logger.error(Server.ERROR_TOKEN_IS_INVALID);
        return ResponseHandler.sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          Server.ERROR_TOKEN_IS_INVALID,
        );
      }
      jwt.verify(tokenReceived, process.env.JWT_SECRET_KEY, (err, payload) => {
        if (err) {
          Logger.error(Server.ERROR_TOKEN_IS_INVALID);
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID,
          );
        }
        const {
          token: { email, role },
        } = payload as any;
        if (!email || !role) {
          Logger.error(Server.ERROR_TOKEN_IS_INVALID);
          return ResponseHandler.sendErrorResponse(
            res,
            StatusCodes.UNAUTHORIZED,
            Server.ERROR_TOKEN_IS_INVALID,
          );
        }
        req.signedInUser = { email, role };
        next();
      });
    } else {
      Logger.error(Server.ERROR_TOKEN_NOT_FOUND);
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        Server.ERROR_TOKEN_NOT_FOUND,
      );
    }
  };
}
