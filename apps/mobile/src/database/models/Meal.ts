import { Model, Q, Query } from '@nozbe/watermelondb';
import { field, date, readonly, children, writer, text } from '@nozbe/watermelondb/decorators';
import type { MealType } from '../../types';
import FoodItem from './FoodItem';

export default class Meal extends Model {
  static table = 'meals';

  static associations = {
    food_items: { type: 'has_many' as const, foreignKey: 'meal_id' },
  };

  @text('user_id') userId!: string;
  @text('name') name!: string;
  @text('meal_type') mealType!: MealType;
  @date('date') date!: Date;
  @field('total_calories') totalCalories!: number;
  @field('total_protein') totalProtein!: number;
  @field('total_carbs') totalCarbs!: number;
  @field('total_fat') totalFat!: number;
  @field('total_fiber') totalFiber?: number;
  @field('total_sugar') totalSugar?: number;
  @field('total_sodium') totalSodium?: number;
  @field('is_synced') isSynced!: boolean;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  @children('food_items') foodItems!: Query<FoodItem>;

  /**
   * Recalculate meal totals based on food items
   */
  @writer async recalculateTotals() {
    const items = await this.foodItems.fetch();
    
    const totals = items.reduce(
      (acc: any, item: any) => {
        const multiplier = item.portion;
        return {
          calories: acc.calories + item.calories * multiplier,
          protein: acc.protein + item.protein * multiplier,
          carbs: acc.carbs + item.carbs * multiplier,
          fat: acc.fat + item.fat * multiplier,
          fiber: acc.fiber + (item.fiber || 0) * multiplier,
          sugar: acc.sugar + (item.sugar || 0) * multiplier,
          sodium: acc.sodium + (item.sodium || 0) * multiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    await this.update((meal: any) => {
      meal.totalCalories = Math.round(totals.calories);
      meal.totalProtein = Math.round(totals.protein);
      meal.totalCarbs = Math.round(totals.carbs);
      meal.totalFat = Math.round(totals.fat);
      meal.totalFiber = Math.round(totals.fiber);
      meal.totalSugar = Math.round(totals.sugar);
      meal.totalSodium = Math.round(totals.sodium);
      meal.isSynced = false;
    });
  }
}
