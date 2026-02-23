import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, relation } from '@nozbe/watermelondb/decorators';
import Meal from './Meal';

export default class FoodItem extends Model {
  static table = 'food_items';

  static associations = {
    meals: { type: 'belongs_to' as const, key: 'meal_id' },
  };

  @relation('meals', 'meal_id') meal!: Meal;
  @field('name') name!: string;
  @field('brand_name') brandName!: string;
  @field('serving_size') servingSize!: number;
  @field('serving_unit') servingUnit!: string;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  @field('fiber') fiber?: number;
  @field('sugar') sugar?: number;
  @field('sodium') sodium?: number;
  @field('barcode') barcode?: string;
  @field('photo_url') photoUrl?: string;
  @field('portion') portion!: number;
  @field('is_synced') isSynced!: boolean;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
