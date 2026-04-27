import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Employees } from './Employees';
import { LeaveTypes } from './LeaveTypes';

@Entity({ name: 'leave_balances' })
export class LeaveBalances {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  totalDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  usedDays: number;

  @ManyToOne(() => Employees, (employee) => employee.leaveBalances, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employees: Employees;

  @RelationId((leaveBalance: LeaveBalances) => leaveBalance.employees)
  employee_id: number;
}
