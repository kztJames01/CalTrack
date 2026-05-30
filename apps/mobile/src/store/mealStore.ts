import { create } from 'zustand';
import { database } from '@/src/database';
import { Q } from '@nozbe/watermelondb';
import Meal from '@/src/database/models/Meal';
import FoodItem from '@/src/database/models/FoodItem';
import { addToSyncQueue } from '@/src/database/sync';

interface MealState {
  selectedDate: Date;
  meals: Meal[];
  isLoading: boolean;
  
  // Derived state
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  
  // Actions
  setSelectedDate: (date: Date) => void;
  loadMealsForDate: (date: Date) => Promise<void>;
  createMeal: (mealType: string, userId: string) => Promise<Meal>;
  addFoodToMeal: (mealId: string, foodData: any) => Promise<void>;
  updateFoodItem: (foodItemId: string, updates: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (foodItemId: string) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  copyMeal: (mealId: string, newDate: Date) => Promise<void>;
  calculateDailyTotals: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  selectedDate: new Date(),
  meals: [],
  isLoading: false,
  dailyTotals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  },

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
    get().loadMealsForDate(date);
  },

  loadMealsForDate: async (date: Date) => {
    set({ isLoading: true });
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const mealCollection = database.collections.get('meals') as any;
      const meals = await mealCollection
        .query(
          Q.where('date', Q.gte(startOfDay.getTime())),
          Q.where('date', Q.lte(endOfDay.getTime())),
          Q.sortBy('date', Q.asc)
        )
        .fetch();

      set({ meals, isLoading: false });
      get().calculateDailyTotals();
    } catch (error) {
      console.error('Failed to load meals:', error);
      set({ isLoading: false });
    }
  },

  createMeal: async (mealType: string, userId: string) => {
    const mealCollection = database.collections.get('meals') as any;
    
    const meal = await database.write(async () => {
      return await mealCollection.create((m: any) => {
        m.userId = userId;
        m.name = mealType;
        m.mealType = mealType;
        m.date = get().selectedDate;
        m.totalCalories = 0;
        m.totalProtein = 0;
        m.totalCarbs = 0;
        m.totalFat = 0;
        m.isSynced = false;
      });
    });

    // Add to sync queue
    await addToSyncQueue('meal', meal.id, 'create', {
      userId,
      mealType,
      mealDate: get().selectedDate.toISOString(),
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    });

    // Reload meals
    await get().loadMealsForDate(get().selectedDate);
    
    return meal;
  },

  addFoodToMeal: async (mealId: string, foodData: any) => {
    const foodItemCollection = database.collections.get('food_items') as any;
    
    await database.write(async () => {
      const foodItem = await foodItemCollection.create((f: any) => {
        f.mealId = mealId;
        f.foodName = foodData.foodName;
        f.brandName = foodData.brandName;
        f.servingSize = foodData.servingSize;
        f.servingUnit = foodData.servingUnit;
        f.calories = foodData.calories;
        f.protein = foodData.protein;
        f.carbs = foodData.carbs;
        f.fat = foodData.fat;
        f.fiber = foodData.fiber;
        f.sugar = foodData.sugar;
        f.sodium = foodData.sodium;
        f.upc = foodData.upc;
        f.confidenceScore = foodData.confidenceScore;
        f.detectionMethod = foodData.detectionMethod;
        f.syncStatus = 'pending';
      });

      // Update meal totals
      const mealCollection = database.collections.get('meals') as any;
      const meal = await mealCollection.find(mealId);
      await meal.recalculateTotals();

      // Add to sync queue
      await addToSyncQueue('foodItem', foodItem.id, 'create', foodData);
    });

    // Reload meals
    await get().loadMealsForDate(get().selectedDate);
  },

  updateFoodItem: async (foodItemId: string, updates: any) => {
    const foodItemCollection = database.collections.get('food_items') as any;
    
    await database.write(async () => {
      const foodItem = await foodItemCollection.find(foodItemId);
      await foodItem.update((f: any) => {
        Object.assign(f, updates);
        f.syncStatus = 'pending';
      });

      // Update meal totals
      const meal = await foodItem.meal;
      await meal.recalculateTotals();

      // Add to sync queue
      await addToSyncQueue('foodItem', foodItemId, 'update', updates);
    });

    // Reload meals
    await get().loadMealsForDate(get().selectedDate);
  },

  deleteFoodItem: async (foodItemId: string) => {
    const foodItemCollection = database.collections.get('food_items') as any;
    
    await database.write(async () => {
      const foodItem = await foodItemCollection.find(foodItemId);
      const meal = await foodItem.meal;
      
      await foodItem.markAsDeleted();
      await meal.recalculateTotals();

      // Add to sync queue
      await addToSyncQueue('foodItem', foodItemId, 'delete', {});
    });

    // Reload meals
    await get().loadMealsForDate(get().selectedDate);
  },

  deleteMeal: async (mealId: string) => {
    const mealCollection = database.collections.get('meals') as any;
    
    await database.write(async () => {
      const meal = await mealCollection.find(mealId);
      
      // Delete all food items first
      const foodItems = await meal.foodItems.fetch();
      for (const item of foodItems) {
        await item.markAsDeleted();
      }
      
      await meal.markAsDeleted();

      // Add to sync queue
      await addToSyncQueue('meal', mealId, 'delete', {});
    });

    // Reload meals
    await get().loadMealsForDate(get().selectedDate);
  },

  copyMeal: async (mealId: string, newDate: Date) => {
    const mealCollection = database.collections.get('meals') as any;
    const foodItemCollection = database.collections.get('food_items') as any;
    
    await database.write(async () => {
      const originalMeal = await mealCollection.find(mealId);
      const originalFoodItems = await originalMeal.foodItems.fetch();

      // Create new meal
      const newMeal = await mealCollection.create((m: any) => {
        m.userId = originalMeal.userId;
        m.name = originalMeal.name;
        m.mealType = originalMeal.mealType;
        m.date = newDate;
        m.totalCalories = originalMeal.totalCalories;
        m.totalProtein = originalMeal.totalProtein;
        m.totalCarbs = originalMeal.totalCarbs;
        m.totalFat = originalMeal.totalFat;
        m.isSynced = false;
      });

      // Copy food items
      for (const item of originalFoodItems) {
        await foodItemCollection.create((f: any) => {
          f.mealId = newMeal.id;
          f.name = item.name;
          f.brandName = item.brandName;
          f.servingSize = item.servingSize;
          f.servingUnit = item.servingUnit;
          f.calories = item.calories;
          f.protein = item.protein;
          f.carbs = item.carbs;
          f.fat = item.fat;
          f.fiber = item.fiber;
          f.sugar = item.sugar;
          f.sodium = item.sodium;
          f.barcode = item.barcode;
          f.syncStatus = 'pending';
        });
      }

      // Add to sync queue
      await addToSyncQueue('meal', newMeal.id, 'create', {
        userId: originalMeal.userId,
        mealType: originalMeal.mealType,
        mealDate: newDate.toISOString(),
      });
    });

    // Reload meals if copying to same date
    if (newDate.toDateString() === get().selectedDate.toDateString()) {
      await get().loadMealsForDate(get().selectedDate);
    }
  },

  calculateDailyTotals: () => {
    const { meals } = get();
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fat: acc.fat + meal.totalFat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    set({ dailyTotals: totals });
  },
}));

// Selectors for derived state
export const selectMacroPercentages = (state: MealState) => {
  const { dailyTotals } = state;
  const totalMacros = dailyTotals.protein * 4 + dailyTotals.carbs * 4 + dailyTotals.fat * 9;
  
  if (totalMacros === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }
  
  return {
    protein: Math.round((dailyTotals.protein * 4 / totalMacros) * 100),
    carbs: Math.round((dailyTotals.carbs * 4 / totalMacros) * 100),
    fat: Math.round((dailyTotals.fat * 9 / totalMacros) * 100),
  };
};

export const selectMealsByType = (state: MealState) => {
  return {
    breakfast: state.meals.filter(m => m.mealType === 'breakfast'),
    lunch: state.meals.filter(m => m.mealType === 'lunch'),
    dinner: state.meals.filter(m => m.mealType === 'dinner'),
    snacks: state.meals.filter(m => m.mealType === 'snack'),
  };
};
