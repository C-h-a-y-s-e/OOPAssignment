import { Router } from 'express';
import morgan, { StreamOptions } from 'morgan';
import { UserController } from '../controllers/UserController';
import Logger from '../helpers/Logger';
import { User } from '../entity/User';
export class UserRouter {
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
