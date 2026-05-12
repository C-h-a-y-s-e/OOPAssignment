import { Request, Response } from 'express';
export interface IGetByEmail {
  getByEmail(req: Request, res: Response): Promise<void>;
}
