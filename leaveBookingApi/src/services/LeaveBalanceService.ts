import { StatusCodes } from 'http-status-codes';
import { AppError } from '../helpers/AppError';
import { Repository } from 'typeorm';
import { User } from '../entity/User';

export class LeaveBalanceService {
  private static async findUser(
    // Looks up user in the repository, if not found return error
    userId: number,
    userRepository: Repository<User>,
  ): Promise<User> {
    const user = await userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    return user;
  }

  static async checkAgainstBalance(
    //Check the users requested days against their current balance, if successful update balance
    userId: number,
    daysRequested: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await this.findUser(userId, userRepository);

    if (user.leaveBalance < daysRequested) {
      throw new AppError(
        `Insufficient leave balance. Requested: ${daysRequested}, Available: ${user.leaveBalance}`,
        StatusCodes.CONFLICT,
      );
    }
    await this.updateLeaveBalance(userId, daysRequested, userRepository);
  }

  static async updateLeaveBalance(
    // When the request is accepted, subtract the users requested days from leaveBalance
    userId: number,
    daysToSubtract: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await this.findUser(userId, userRepository);

    user.leaveBalance = Math.max(0, user.leaveBalance - daysToSubtract);
    await userRepository.save(user);
  }

  static async restoreLeaveBalance(
    // Upon denial/cancellation, restore the days to leaveBalance
    userId: number,
    daysToAdd: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await this.findUser(userId, userRepository);

    user.leaveBalance += daysToAdd;
    await userRepository.save(user);
  }

  static async resetLeaveBalance(
    //Reset leaveBalance to default (25)
    userId: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await this.findUser(userId, userRepository);
    const defaultBalance = 25;
    user.leaveBalance = defaultBalance;
    await userRepository.save(user);
  }
}
