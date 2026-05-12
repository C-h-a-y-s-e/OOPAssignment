import { Request, Response } from 'express';
export interface ILoginController {
  login(req: Request, res: Response): Promise<void>;
  //TODO: ADD log out method
}
