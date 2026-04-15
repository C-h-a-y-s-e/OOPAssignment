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

@Entity({ name: 'employees' })
export class Employees {
  @PrimaryGeneratedColumn()
  id: number;
  //TODO: Add manager ID
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  email: string;

  @ManyToOne(() => Role, (role) => role.employees, { nullable: false })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @RelationId((employee: Employees) => employee.role)
  role_id: number;

  @OneToMany(() => LeaveBalances, (leaveBalances) => leaveBalances.employees)
  leaveBalances: LeaveBalances[];

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.employees)
  leaveRequests: LeaveRequests[];
}
