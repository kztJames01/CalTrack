import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';
import type { ActivityLevel, Goal } from '../../types';

export default class User extends Model {
  static table = 'users';

  @field('email') email!: string;
  @field('name') name!: string;
  @field('age') age?: number;
  @field('gender') gender?: 'male' | 'female' | 'other';
  @field('height_cm') heightCm?: number;
  @field('weight_kg') weightKg?: number;
  @field('activity_level') activityLevel?: ActivityLevel;
  @field('goal') goal?: Goal;
  @field('calorie_goal') calorieGoal?: number;
  @field('protein_goal') proteinGoal?: number;
  @field('carbs_goal') carbsGoal?: number;
  @field('fat_goal') fatGoal?: number;
  @field('unit_preference') unitPreference?: 'metric' | 'imperial';
  @field('is_synced') isSynced!: boolean;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
