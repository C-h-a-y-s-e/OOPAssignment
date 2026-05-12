import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { User } from './User';
@Entity({ name: 'usermanagement' })
export class UserManagement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userManagement, {
    nullable: false,
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'userId' })
  User: User;

  @RelationId((userManagement: UserManagement) => userManagement.User)
  user_id: number;

  @ManyToOne(() => User, {
    nullable: false,
  })
  @JoinColumn({ name: 'manager_id', referencedColumnName: 'userId' })
  Manager: User;

  @RelationId((userManagement: UserManagement) => userManagement.Manager)
  manager_id: number;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;
}
