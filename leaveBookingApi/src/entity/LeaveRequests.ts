import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { Employees } from './Employees';
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

  @ManyToOne(() => Employees, (employee) => employee.leaveRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employees: Employees;

  @RelationId((leaveRequest: LeaveRequests) => leaveRequest.employees)
  employee_id: number;
}
