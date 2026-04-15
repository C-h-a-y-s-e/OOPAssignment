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

  @Column()
  totalDays: Float16Array;

  @Column()
  usedDays: Float16Array; //TODO: find what's best for decimal

  @ManyToOne(() => Employees, (employee) => employee.leaveBalances, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employees: Employees;

  @RelationId((employee: Employees) => employee.role)
  role_id: number;
}
