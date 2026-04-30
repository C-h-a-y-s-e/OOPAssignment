import { Server } from './Server';
import { Router } from 'express';
import { Logger } from './helpers/Logger';
import { AppDataSource } from './data-source';
import { RoleRouter } from './routes/RoleRouter';
import { RoleController } from './controllers/RoleController';
import { Role } from './entity/Roles';
import { UserRouter } from './routes/UserRouter';
import { UserController } from './controllers/UserController';
import { User } from './entity/User';
// Initialise the port
const DEFAULT_PORT = 8900;
const port = process.env.SERVER_PORT || DEFAULT_PORT;
if (!process.env.SERVER_PORT) {
  Logger.info(
    'PORT environment variable is not set, defaulting to ' + DEFAULT_PORT,
  );
}
// Initialise the data source
const appDataSource = AppDataSource;
// Initialise routers
const roleRouter = new RoleRouter(
  Router(),
  new RoleController(AppDataSource.getRepository(Role)),
);

const userRouter = new UserRouter(
  Router(),
  new UserController(AppDataSource.getRepository(User)),
);

// Instantiate/start the server
const server = new Server(port, roleRouter, userRouter, appDataSource);
server.start();
