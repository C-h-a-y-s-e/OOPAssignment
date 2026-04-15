import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Role } from './Roles';
import { LeaveBalances } from './LeaveBalances';
import { LeaveRequests } from './leaveRequests';

@Entity({ name: 'leave_types' })
export class LeaveTypes {
  @PrimaryGeneratedColumn()
  id: number;
  //TODO: Add manager ID
  @Column()
  description: string;

  @Column()
  isPaid: boolean;

  @Column()
  type: string;

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.leaveTypes)
  leaveRequests: LeaveRequests[];
}
