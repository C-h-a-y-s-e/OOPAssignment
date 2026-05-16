import { Router } from 'express';
import { IRouter } from '../types/IRouter';
import { MiddlewareFactory } from '../middleware/MiddlewareFactory';
import { IEntityController } from '../types/IEntityController';

export class UserManagementRouter implements IRouter {
  authenticate: boolean = true;
  routeName: string = 'userManagement';
  limiter: any = MiddlewareFactory.jwtRateLimiter;
  basePath: string = '/api/userManagement';

  constructor(
    private router: Router,
    private userManagementController: IEntityController,
  ) {
    this.addRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get('/', this.userManagementController.getAll);
    this.router.get('/:id', this.userManagementController.getById);
    this.router.post('/', this.userManagementController.create);
    this.router.patch('/:id', this.userManagementController.update);
    this.router.delete('/:id', this.userManagementController.delete);
  }
}
