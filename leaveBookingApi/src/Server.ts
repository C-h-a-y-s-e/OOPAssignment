import express, { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { RoleRouter } from './routes/RoleRouter';
import Logger from './helpers/Logger';
import { UserRouter } from './routes/UserRouter';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from './helpers/ResponseHandler';
import morgan, { StreamOptions } from 'morgan';
export class Server {
  private readonly app: express.Application;
  constructor(
    private readonly port: string | number,
    private readonly roleRouter: RoleRouter,
    private readonly userRouter: UserRouter,
    private readonly appDataSource: DataSource,
  ) {
    this.app = express();
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

    this.app.use(express.json());
    this.app.use(morgan('combined', { stream: morganStream }));
  }
  private initialiseRoutes() {
    this.app.get(['/api', '/api/'], (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('API is running');
    });
    this.app.use('/api/roles', this.roleRouter.getRouter());
    this.app.use('/api/user', this.userRouter.getRouter());
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
}
