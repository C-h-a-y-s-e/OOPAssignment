import { Router } from 'express';
export interface IRouter {
  authenticate: boolean;
  routeName: string;
  limiter: any;
  basePath: string;
  getRouter(): Router;
}
