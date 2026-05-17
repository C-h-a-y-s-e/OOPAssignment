import { Router } from 'express';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
export class MyRouter {
  constructor(private router: Router) {
    this.addRoutes();
  }
  public getRouter(): Router {
    // Return an express router object with all routes attatched
    return this.router;
  }
  private addRoutes() {
    this.router.get('/', (req: Request, res: Response) => {
      res.status(StatusCodes.OK).send('reached index');
    });
    this.router.get('/other', (req: Request, res: Response) => {
      // All routers should have a get request
      res.status(StatusCodes.OK).send('reached other');
    });
  }
}
