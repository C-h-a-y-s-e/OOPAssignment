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
export class LeaveRequests {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => LeaveTypes, (leaveType) => leaveType.leaveRequests, {
    nullable: false,
  })
  @Column()
  endDate: Float16Array;

  @Column()
  startDate: Float16Array; //TODO: find what's best for decimal

  @Column()
  status: string; //TODO: Add foreign key for managerin emp table?

  @ManyToOne(() => LeaveTypes, (leaveTypes) => leaveTypes.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'leave_type_id', referencedColumnName: 'id' })
  leaveTypes: LeaveTypes;

  @ManyToOne(() => Employees, (employee) => employee.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employees: Employees;

  @RelationId((employee: Employees) => employee.role)
  role_id: number;
}
