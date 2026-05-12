import express, { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';
import { RoleRouter } from './routes/RoleRouter';
import { IRouter } from './types/IRouter';
import Logger from './helpers/Logger';
import { UserRouter } from './routes/UserRouter';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from './helpers/ResponseHandler';
import morgan, { StreamOptions } from 'morgan';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import requestIP, { rateLimit } from 'express-rate-limit';
import { IAuthenticatedJWTRequest } from './types/IAuthenticatedJWTRequest';
export class Server {
  public static readonly ERROR_TOKEN_IS_INVALID =
    'Not authorised: Token is invalid';
  public static readonly ERROR_TOKEN_NOT_FOUND =
    'Not authorised: Token not found';
  public static readonly ERROR_TOKEN_SECRET_NOT_DEFINED =
    'Not authorised: JWT secret not defined';
  public static readonly TOO_MANY_REQUESTS_MESSAGE = 'Too many requests';
  private readonly app: express.Application;
  private readonly loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100, //Maximum requests per window
    message: Server.TOO_MANY_REQUESTS_MESSAGE,
    standardHeaders: true, //Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, //Disable the X-RateLimit-* headers
  });
  private readonly jwtRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 20, //Maximum requests per window
    message: Server.TOO_MANY_REQUESTS_MESSAGE,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      return req.signedInUser?.email || requestIP(req);
    },
  });
  constructor(
    private readonly port: string | number,
    private readonly routers: IRouter[],
    private readonly appDataSource: DataSource,
  ) {
    this.app = express();
    this.app.use(helmet());
    this.initialiseMiddleWares();
    this.initialiseRoutes();
    this.initialiseErrorHandling();
  }
  private initialiseMiddleWares() {
    const morganStream: StreamOptions = {
      write: (message: string): void => {
        Logger.info(message.trim());
      },
    };

    this.app.use((req: Request, res: Response, next) => {
      Logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
      next();
    });
    this.app.use(express.json());
    this.app.use(morgan('combined', { stream: morganStream }));
  }

  private initialiseRoutes() {
    for (const route of this.routers) {
      const middlewares: express.RequestHandler[] = [];
      if (route.authenticate) {
        middlewares.push(this.authenticateToken);
      }
      if (route.limiter) {
        middlewares.push(route.limiter);
      }
      middlewares.push(this.logRouteAccess(route.routeName));
      this.app.use(route.basePath, ...middlewares, route.getRouter());
    }
  }
  private initialiseErrorHandling() {
    this.app.use((req: Request, res: Response) => {
      const requestedUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.NOT_FOUND,
        'Route ' + requestedUrl + ' not found',
      );
    });
  }
  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      Logger.info(`Server running on http://localhost:${this.port}`);
    });
  }

  private async initialiseDataSource() {
    try {
      await this.appDataSource.initialize();
      Logger.info('Data Source initialised');
    } catch (error) {
      Logger.error('Error during initialisation:', error);
      throw error;
    }
  }
  private authenticateToken(
    req: IAuthenticatedJWTRequest,
    res: Response,
    next: NextFunction,
  ) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const tokenReceived = authHeader.split(' ')[1];
      if (!process.env.JWT_SECRET_KEY) {
        Logger.error(Server.ERROR_TOKEN_SECRET_NOT_DEFINED);
        throw new Error(Server.ERROR_TOKEN_SECRET_NOT_DEFINED);
      }
      jwt.verify(tokenReceived, process.env.JWT_SECRET_KEY, (err, payload) => {
        if (err) {
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
      ResponseHandler.sendErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        Server.ERROR_TOKEN_NOT_FOUND,
      );
    }
  }
  private logRouteAccess(route: string) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      Logger.info(`${route} accessed by ${req.ip}`);
      next();
    };
  }
}
