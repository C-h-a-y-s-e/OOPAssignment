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
import { LoginController } from './controllers/LoginController';
import { LoginRouter } from './routes/LoginRouter';
import { RequestRouter } from './routes/RequestRouter';
import { RequestController } from './controllers/RequestController';
import { LeaveRequests } from './entity/LeaveRequests';
import { UserManagement } from './entity/UserManagement';
import { UserManagementController } from './controllers/UserManagementController';
import { UserManagementRouter } from './routes/UserManagementRouter';
import { RequestService } from './services/RequestService';
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
const routers = [
  new LoginRouter(
    Router(),
    new LoginController(AppDataSource.getRepository(User)),
  ),
  new RoleRouter(
    Router(),
    new RoleController(AppDataSource.getRepository(Role)),
  ),
  new UserRouter(
    Router(),
    new UserController(AppDataSource.getRepository(User)),
  ),
  new RequestRouter(
    Router(),
    new RequestController(
      new RequestService(
        AppDataSource.getRepository(LeaveRequests),
        AppDataSource.getRepository(User),
        AppDataSource.getRepository(UserManagement),
      ),
    ),
  ),
  new UserManagementRouter(
    Router(),
    new UserManagementController(
      AppDataSource.getRepository(UserManagement),
      AppDataSource.getRepository(User),
    ),
  ),
];
// Instantiate/start the server
const server = new Server(port, routers, appDataSource);
server.start();
