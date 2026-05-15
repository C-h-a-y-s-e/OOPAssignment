import { StatusCodes } from 'http-status-codes';
import { AppError } from '../helpers/AppError';
import { Repository } from 'typeorm';
import { User } from '../entity/User';

export class LeaveBalanceService {
  static async checkAgainstBalance(
    userId: number,
    daysRequested: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    if (user.leaveBalance < daysRequested) {
      throw new AppError(
        `Insufficient leave balance. Requested: ${daysRequested}, Available: ${user.leaveBalance}`,
        StatusCodes.CONFLICT,
      );
    }
    await this.updateLeaveBalance(userId, daysRequested, userRepository);
  }

  static async updateLeaveBalance(
    userId: number,
    daysToSubtract: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    user.leaveBalance = Math.max(0, user.leaveBalance - daysToSubtract);
    await userRepository.save(user);
  }

  static async restoreLeaveBalance(
    userId: number,
    daysToAdd: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await userRepository.findOne({ where: { userId } });

    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }

    user.leaveBalance += daysToAdd;
    await userRepository.save(user);
  }

  static async resetLeaveBalance(
    userId: number,
    userRepository: Repository<User>,
  ): Promise<void> {
    const user = await userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    } //TODO: move useridvalidation into a seperate method
    user.leaveBalance = 25;
    await userRepository.save(user);
  }
}
