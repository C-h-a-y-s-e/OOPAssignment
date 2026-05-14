import { Router } from 'express';
import morgan, { StreamOptions } from 'morgan';
import { UserController } from '../controllers/UserController';
import Logger from '../helpers/Logger';
import { IRouter } from '../types/IRouter';
import { Server } from '../Server';
import { User } from '../entity/User';
import { MiddlewareFactory } from '../middleware/MiddlewareFactory';
import { IEntityController } from '../types/IEntityController';
import { IGetByEmail } from '../types/IGetByEmail';
export class UserRouter implements IRouter {
  authenticate: boolean = true;
  routeName: string = 'users';
  limiter: any = MiddlewareFactory.jwtRateLimiter; //TODO: look further into as any
  basePath: string = '/api/user';
  constructor(
    private router: Router,
    private userController: IEntityController & IGetByEmail,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get('/', this.userController.getAll);
    this.router.get('/email/:emailAddress', this.userController.getByEmail);
    this.router.post('/', this.userController.create);
    this.router.patch(
      '/:userId/reset-balance',
      (this.userController as any).resetBalance,
    );
    this.router.get('/:id', this.userController.getById);
    this.router.delete('/:id', this.userController.delete);
    this.router.patch('/:id', this.userController.update);
  }
}
