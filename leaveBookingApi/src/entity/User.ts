import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { Role } from './Roles';
import { Exclude } from 'class-transformer';
import { LeaveBalances } from './LeaveBalances';
import { LeaveRequests } from './LeaveRequests';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  userId: number;
  //TODO: Add manager ID
  @Column()
  firstname: string;

  @Column()
  surname: string;

  @Column({ select: false })
  @Exclude()
  @IsString()
  @Matches(/\S/, { message: 'Password cannot be empty or whitespace' })
  @MinLength(10, { message: 'Password must be at least 10 characters' })
  password: string;

  @Column({ unique: true })
  @IsEmail({}, { message: 'Must be valid email address' })
  email: string;

  @ManyToOne(() => Role, (role) => role.User, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'roleId', referencedColumnName: 'id' })
  role: Role;

  @RelationId((user: User) => user.role)
  roleId: number;

  @OneToMany(() => LeaveBalances, (leaveBalances) => leaveBalances.User)
  leaveBalances: LeaveBalances[];

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.User)
  leaveRequests: LeaveRequests[];
}
