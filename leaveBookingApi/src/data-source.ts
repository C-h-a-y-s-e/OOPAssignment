import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Role } from './entity/Roles';
import { LeaveRequests } from './entity/LeaveRequests';
import { LeaveTypes } from './entity/LeaveTypes';
import { User } from './entity/User';
import { UserManagement } from './entity/UserManagement';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

function requireEnv(name: string, allowEmpty = false): string {
  const value = process.env[name];
  if (value === undefined || (!allowEmpty && value === '')) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function requireEnvNumber(name: string): number {
  const value = Number(requireEnv(name));
  if (Number.isNaN(value)) throw new Error(`Env var ${name} must be a number`);
  return value;
}

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: requireEnv('DB_HOST'),
  port: requireEnvNumber('DB_PORT'),
  username: requireEnv('DB_USERNAME'),
  password: requireEnv('DB_PASSWORD', true),
  database: requireEnv('DB_DATABASE'),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: false,
  entities: [Role, LeaveRequests, LeaveTypes, User, UserManagement],
});
