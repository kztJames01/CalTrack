import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Meal } from './meal.entity';

@Entity('food_items')
export class FoodItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mealId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  brandName?: string;

  @Column({ nullable: true })
  barcode?: string;

  @Column('decimal', { precision: 8, scale: 2 })
  calories: number;

  @Column('decimal', { precision: 6, scale: 2 })
  protein: number;

  @Column('decimal', { precision: 6, scale: 2 })
  carbs: number;

  @Column('decimal', { precision: 6, scale: 2 })
  fat: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  fiber?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  sugar?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  sodium?: number;

  @Column()
  servingSize: string;

  @Column()
  servingUnit: string;

  @Column('decimal', { precision: 6, scale: 2, default: 1 })
  quantity: number;

  @Column({ default: false })
  isCustom: boolean;

  @Column({ nullable: true })
  photoUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Meal, (meal) => meal.foodItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mealId' })
  meal: Meal;
}
