import express, { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import { RoleRouter } from './routes/RoleRouter';
import { StatusCodes } from 'http-status-codes';
export class Server {
  private readonly app: express.Application;
  constructor(
    private readonly port: string | number,
    private readonly roleRouter: RoleRouter,
    private readonly appDataSource: DataSource,
  ) {
    this.app = express();
    this.initialiseMiddlewares();
    this.initialiseRoutes();
    this.initialiseErrorHandling();
  }
  private initialiseMiddlewares() {
    this.app.use(express.json());
  }
  private initialiseRoutes() {
    this.app.get(['/api', '/api/'], (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('API is running');
    });
    this.app.use('/api/roles', this.roleRouter.getRouter());
  }
  private initialiseErrorHandling() {
    this.app.use((req: Request, res: Response) => {
      const requestedUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      res
        .status(StatusCodes.NOT_FOUND)
        .send('Route ' + requestedUrl + ' not found');
    });
  }
  public async start() {
    await this.initialiseDataSource();
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
  private async initialiseDataSource() {
    try {
      await this.appDataSource.initialize();
      console.log('Data Source initialised');
    } catch (error) {
      console.log('Error during initialisation:', error);
      throw error;
    }
  }
}
