import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FoodItem } from './food-item.entity';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: MealType,
  })
  type: MealType;

  @Column({ type: 'timestamp' })
  eatenAt: Date;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column('decimal', { precision: 8, scale: 2, default: 0 })
  totalCalories: number;

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  totalProtein: number;

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  totalCarbs: number;

  @Column('decimal', { precision: 6, scale: 2, default: 0 })
  totalFat: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  syncedAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => FoodItem, (foodItem) => foodItem.meal, { cascade: true })
  foodItems: FoodItem[];
}
