import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { IsNotEmpty, IsIn } from 'class-validator';
import { User } from './User';
import { LeaveTypes } from './LeaveTypes';

enum LeaveRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
}

@Entity({ name: 'leave_requests' })
export class LeaveRequests {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: Date;

  @Column({ type: 'date' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: LeaveRequestStatus,
    default: LeaveRequestStatus.PENDING,
  })
  @IsNotEmpty({ message: 'Status is required' })
  @IsIn(Object.values(LeaveRequestStatus), {
    message: 'Status must be one of: pending, approved, denied',
  })
  status: LeaveRequestStatus;

  @ManyToOne(() => LeaveTypes, (leaveTypes) => leaveTypes.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'leave_type_id', referencedColumnName: 'id' })
  leaveType: LeaveTypes;

  @ManyToOne(() => User, (user) => user.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  User: User;

  @RelationId((leaveRequest: LeaveRequests) => leaveRequest.User)
  userId: number;
}
