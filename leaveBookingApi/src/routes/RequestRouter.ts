import { Router } from 'express';
import morgan, { StreamOptions } from 'morgan';
import Logger from '../helpers/Logger';
import { IRouter } from '../types/IRouter';
import { Server } from '../Server';
import { MiddlewareFactory } from '../middleware/MiddlewareFactory';
import { IEntityController } from '../types/IEntityController';
export class RequestRouter implements IRouter {
  authenticate: boolean = true;
  routeName: string = 'leaveRequests';
  limiter: any = MiddlewareFactory.jwtRateLimiter;
  basePath: string = '/api/leaveRequests';
  constructor(
    private router: Router,
    private requestController: IEntityController,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get('/', this.requestController.getAll);
    this.router.get(
      '/user/:userId',
      (this.requestController as any).getByUserId,
    );
    this.router.get(
      '/manager/:userId',
      (this.requestController as any).getForManager,
    );
    this.router.get(
      '/balance/:userId',
      (this.requestController as any).getLeaveBalance,
    );
    this.router.get('/:id', this.requestController.getById);
    this.router.post('/', this.requestController.create);
    this.router.delete('/all', (this.requestController as any).deleteAll);
    this.router.delete('/:id', this.requestController.delete);
    this.router.patch('/:id', this.requestController.update);
  }
}
