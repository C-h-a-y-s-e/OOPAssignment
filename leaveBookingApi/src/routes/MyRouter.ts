import { Router } from 'express';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
export class MyRouter {
  constructor(private router: Router) {
    this.addRoutes();
  }
  public getRouter(): Router {
    return this.router;
  }
  private addRoutes() {
    this.router.get('/', (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('reached index');
    });
    this.router.get('/other', (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('reached other');
    });
  }
}
