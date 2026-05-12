import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  BeforeInsert,
  JoinColumn,
  OneToMany,
  RelationId,
} from 'typeorm';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { Role } from './Roles';
import { PasswordHandler } from '../helpers/PasswordHandler';
import { Exclude } from 'class-transformer';
import { LeaveRequests } from './LeaveRequests';
import { LeaveBalances } from './LeaveBalances';
import { UserManagement } from './UserManagement';
@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn()
  userId: number;

  @Column()
  firstname: string;

  @Column()
  surname: string;

  @Column({ select: false }) //obscure from get queries
  @IsString()
  @Exclude() //after post queries - need instanceToPlain when responding
  @Matches(/\S/, { message: 'Password cannot be empty or whitespace' })
  @MinLength(10, { message: 'Password must be at least 10 characters long' })
  password: string;

  @Column({ select: false }) //obscure from get queries
  @Exclude() //after post queries - need instanceToPlain when responding
  salt: string; // Security salt for password hashing

  @Column({ unique: true })
  @IsEmail({}, { message: 'Must be a valid email address' })
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

  @OneToMany(() => UserManagement, (userManagement) => userManagement.User)
  userManagement: UserManagement[];

  @OneToMany(() => LeaveRequests, (leaveRequests) => leaveRequests.User)
  leaveRequests: LeaveRequests[];

  @BeforeInsert()
  hashPassword() {
    if (!this.password) {
      throw new Error('Password must be provided before inserting a user.');
    }
    const { hashedPassword, salt } = PasswordHandler.hashPassword(
      this.password,
    );
    this.password = hashedPassword;
    this.salt = salt;
  }
}
