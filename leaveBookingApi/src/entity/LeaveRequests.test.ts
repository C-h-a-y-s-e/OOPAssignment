import { LeaveRequests } from './LeaveRequests';
import { LeaveTypes } from './LeaveTypes';
import { User } from './User';
import { validate } from 'class-validator';

describe('LeaveRequests Entity', () => {
  let leaveRequest: LeaveRequests;
  let leaveType: LeaveTypes;
  let user: User;

  beforeEach(() => {
    //before each test reset the following:
    leaveType = new LeaveTypes();
    leaveType.id = 1;
    leaveType.type = 'Annual';
    leaveType.description = 'Annual leave';
    leaveType.isPaid = true;
    //user properties
    user = new User();
    user.userId = 1;
    user.email = 'test@example.com';
    // request properties
    leaveRequest = new LeaveRequests();
    leaveRequest.id = 1;
    leaveRequest.startDate = new Date('2026-06-01');
    leaveRequest.endDate = new Date('2026-06-05');
    leaveRequest.status = 'pending' as any;
    leaveRequest.leaveType = leaveType;
    leaveRequest.User = user;
    leaveRequest.userId = user.userId;
  });

  it('start date required', async () => {
    // assign undefined for validation test
    (leaveRequest as any).startDate = undefined;
    const errors = await validate(leaveRequest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('end date required', async () => {
    // assign undefined for validation test
    (leaveRequest as any).endDate = undefined;
    const errors = await validate(leaveRequest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects an invalid status', async () => {
    // set invalid status
    // set invalid status via cast
    (leaveRequest as any).status = 'not a valid status';
    const errors = await validate(leaveRequest);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
    expect(errors[0].constraints).toHaveProperty('isIn'); // must be part of the set list
  });

  it('accept a properly formed leave request', async () => {
    const errors = await validate(leaveRequest);
    expect(errors.length).toBe(0); //Expect no errors
  });
});
