import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
@Entity({ name: 'usermanagement' })
export class UserManagement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userManagement, {
    nullable: false,
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'userId' })
  User: User;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'managerID', referencedColumnName: 'userId' })
  Manager: User;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;
}
