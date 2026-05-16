import { StatusCodes } from 'http-status-codes';
import { Repository } from 'typeorm';
import { AppError } from './AppError';
import { User } from '../entity/User';

export async function ensureCallerHasRoles(
  userRepository: Repository<User>,
  callerEmail: string | undefined,
  allowedRoles: string[],
  errorMessage: string,
): Promise<void> {
  if (!callerEmail) {
    throw new AppError('Not authorised', StatusCodes.UNAUTHORIZED);
  }

  const callerUser = await userRepository.findOne({
    where: { email: callerEmail.toLowerCase() },
    relations: ['role'],
  });

  const callerRole = callerUser?.role?.name?.toLowerCase();
  const allowedRoleNames = allowedRoles.map((role) => role.toLowerCase());

  if (!callerRole || !allowedRoleNames.includes(callerRole)) {
    throw new AppError(errorMessage, StatusCodes.FORBIDDEN);
  }
}
