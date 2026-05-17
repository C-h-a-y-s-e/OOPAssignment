import { LeaveBalanceService } from './LeaveBalanceService';
import { AppError } from '../helpers/AppError';
import { StatusCodes } from 'http-status-codes';

describe('LeaveBalanceService', () => {
  const makeRepo = (user: any) => ({
    findOne: jest.fn().mockResolvedValue(user), //Promise that will return user
    save: jest.fn().mockResolvedValue(undefined), // Mock function, promise return undefined
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('checkAgainstBalance throws when user not found', async () => {
    const repo = makeRepo(undefined);
    await expect(
      //expects the promises below to be rejected, userid not in the repo
      LeaveBalanceService.checkAgainstBalance(1, 5, repo as any),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      LeaveBalanceService.checkAgainstBalance(1, 5, repo as any),
    ).rejects.toMatchObject({ statusCode: StatusCodes.NOT_FOUND });
  });

  test('checkAgainstBalance throws when insufficient balance', async () => {
    const repo = makeRepo({ userId: 1, leaveBalance: 2 });
    await expect(
      LeaveBalanceService.checkAgainstBalance(1, 5, repo as any),
    ).rejects.toMatchObject({ statusCode: StatusCodes.CONFLICT });
  });

  test('checkAgainstBalance calls updateLeaveBalance when sufficient', async () => {
    const repo = makeRepo({ userId: 1, leaveBalance: 10 });
    const spy = jest
      .spyOn(LeaveBalanceService as any, 'updateLeaveBalance')
      .mockResolvedValue(undefined);

    await LeaveBalanceService.checkAgainstBalance(1, 5, repo as any);

    expect(spy).toHaveBeenCalledWith(1, 5, repo); // Check that the updateLeaveBalance was called with these values
  });

  test('updateLeaveBalance subtracts days and saves/ floor at 0', async () => {
    const user = { userId: 2, leaveBalance: 4 };
    const repo = makeRepo(user);

    await LeaveBalanceService.updateLeaveBalance(2, 3, repo as any);
    expect(repo.save).toHaveBeenCalled();
    const saved = repo.save.mock.calls[0][0]; //call (1st) and object (the user)
    expect(saved.leaveBalance).toBe(1);

    // Ensure that if more than avaliable balance was somehow subtracted values do not enter negative
    repo.findOne.mockResolvedValue({ userId: 2, leaveBalance: 2 });
    await LeaveBalanceService.updateLeaveBalance(2, 5, repo as any);
    const saved2 = repo.save.mock.calls[1][0];
    expect(saved2.leaveBalance).toBe(0);
  });

  test('restoreLeaveBalance adds days and saves', async () => {
    const user = { userId: 3, leaveBalance: 5 };
    const repo = makeRepo(user);
    await LeaveBalanceService.restoreLeaveBalance(3, 4, repo as any);
    expect(repo.save).toHaveBeenCalled();
    const saved = repo.save.mock.calls[0][0];
    expect(saved.leaveBalance).toBe(9); // 5 + 4
  });

  test('resetLeaveBalance sets to 25 and saves', async () => {
    const user = { userId: 4, leaveBalance: 0 };
    const repo = makeRepo(user);
    await LeaveBalanceService.resetLeaveBalance(4, repo as any);
    expect(repo.save).toHaveBeenCalled();
    const saved = repo.save.mock.calls[0][0];
    expect(saved.leaveBalance).toBe(25); // When reset should return to 25
  });
});
