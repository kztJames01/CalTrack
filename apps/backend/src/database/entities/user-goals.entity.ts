import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_goals')
export class UserGoals {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('int')
  dailyCalories: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  proteinGrams?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  carbsGrams?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  fatGrams?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
