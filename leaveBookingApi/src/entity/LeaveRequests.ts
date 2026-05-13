import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { User } from './User';
import { LeaveTypes } from './LeaveTypes';

@Entity({ name: 'leave_requests' })
export class LeaveRequests {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'date' })
  startDate: Date;

  @Column()
  status: string; //TODO: Add foreign key for managerin emp table?

  @ManyToOne(() => LeaveTypes, (leaveTypes) => leaveTypes.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'leave_type_id', referencedColumnName: 'id' })
  leaveTypes: LeaveTypes;

  @ManyToOne(() => User, (user) => user.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  User: User;

  @RelationId((leaveRequest: LeaveRequests) => leaveRequest.User)
  userId: number;
}
