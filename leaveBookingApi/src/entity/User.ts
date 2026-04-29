import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import { Role } from './Roles';
import { LeaveBalances } from './LeaveBalances';
import { LeaveRequests } from './LeaveRequests';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  //TODO: Add manager ID
  @Column()
  firstname: string;

  @Column()
  surname: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Must be valid email address' })
  email: string;

  @ManyToOne(() => Role, (role) => role.User, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'id' })
  role: Role;

  @RelationId((user: User) => user.role)
  roleId: number;

  @OneToMany(() => LeaveBalances, (leaveBalances) => leaveBalances.User)
  leaveBalances: LeaveBalances[];

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.User)
  leaveRequests: LeaveRequests[];
}
