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
import { LeaveRequests } from './LeaveRequests';

@Entity({ name: 'leave_types' })
export class LeaveTypes {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  description: string;

  @Column()
  isPaid: boolean;

  @Column()
  type: string;

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.leaveType)
  leaveRequests: LeaveRequests[];
}
