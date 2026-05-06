import express from 'express';
import { Role } from '../entity/Roles';
export interface IAuthenticatedJWTRequest extends express.Request {
  signedInUser?: {
    email?: string;
    role?: Role;
  };
}
