import { Router } from 'express';
import morgan, { StreamOptions } from 'morgan';
import { RoleController } from '../controllers/RoleController';
import Logger from '../helpers/Logger';
import { IRouter } from '../types/IRouter';
import { Server } from '../Server';
import { MiddlewareFactory } from '../middleware/MiddlewareFactory';
import { IEntityController } from '../types/IEntityController';
export class RoleRouter implements IRouter {
  authenticate: boolean = true;
  routeName: string = 'roles';
  limiter: any = MiddlewareFactory.jwtRateLimiter;
  basePath: string = '/api/roles';
  constructor(
    private router: Router,
    private roleController: IEntityController,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get('/', this.roleController.getAll);
    this.router.get('/:id', this.roleController.getById);
    this.router.post('/', this.roleController.create);
    this.router.delete('/:id', this.roleController.delete);
    this.router.patch('/:id', this.roleController.update);
  }
}
