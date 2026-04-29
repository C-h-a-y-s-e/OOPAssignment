import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { User } from './User';
import { LeaveTypes } from './LeaveTypes';

@Entity({ name: 'leave_balances' })
export class LeaveBalances {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  usedDays: number;

  @ManyToOne(() => User, (user) => user.leaveBalances, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  User: User;

  @RelationId((leaveBalance: LeaveBalances) => leaveBalance.User)
  user_id: number;
}
