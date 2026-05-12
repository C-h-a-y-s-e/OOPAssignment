import { Router } from 'express';
import { ILoginController } from '../types/ILoginController';
import { IRouter } from '../types/IRouter';
import { Server } from '../Server';
import { MiddlewareFactory } from '../middleware/MiddlewareFactory';
export class LoginRouter implements IRouter {
  authenticate: boolean = false;
  routeName: string = 'login';
  limiter: any = MiddlewareFactory.loginLimiter;
  basePath: string = '/api/login';
  constructor(
    private router: Router,
    private loginController: ILoginController,
  ) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.post('/', this.loginController.login);
  }
}
