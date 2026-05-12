import { Router } from 'express';
import morgan, { StreamOptions } from 'morgan';
import { UserController } from '../controllers/UserController';
import Logger from '../helpers/Logger';
import { IRouter } from '../types/IRouter';
import { Server } from '../Server';
import { User } from '../entity/User';
export class UserRouter implements IRouter {
  authenticate: boolean = true;
  routeName: string = 'users';
  limiter: any = (Server as any).jwtRateLimiter; //TODO: look further into as any
  basePath: string = '/api/users';
  constructor(
    private router: Router,
    private userController: UserController,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }

  private addRoutes() {
    this.router.get('/', this.userController.getAll);
    this.router.get('/email/:emailAddress', this.userController.getByEmail);
    this.router.get('/:id', this.userController.getById);
    this.router.post('/', this.userController.create);
    this.router.delete('/:id', this.userController.delete);
    this.router.patch('/:id', this.userController.update);
  }
}
