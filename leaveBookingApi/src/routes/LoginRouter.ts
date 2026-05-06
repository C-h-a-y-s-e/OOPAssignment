import { Router } from 'express';
import { LoginController } from '../controllers/LoginController';
export class LoginRouter {
  constructor(
    private router: Router,
    private loginController: LoginController,
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
