import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Employees } from './Employees';

@Entity({ name: 'role' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(30, { message: 'Name must be 30 characters or less' })
  name: string;

  @OneToMany(() => Employees, (employee) => employee.role)
  employees: Employees[];
}
