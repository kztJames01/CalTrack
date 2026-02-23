import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '@/src/database';
import User from '@/src/database/models/User';
import { addToSyncQueue } from '@/src/database/sync';

interface UserPreferences {
  id?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  goal?: string;
  dailyCalorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  preferredUnits: 'metric' | 'imperial';
}

interface UserState extends UserPreferences {
  isLoading: boolean;
  lastSyncTime?: number;
  streakDays: number;
  
  // Actions
  loadUserPreferences: () => Promise<void>;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  calculateCalorieGoal: (params: CalorieCalculatorParams) => number;
  updateMacroGoals: (proteinPercent: number, carbsPercent: number, fatPercent: number) => Promise<void>;
  toggleUnits: () => Promise<void>;
  calculateStreak: () => Promise<number>;
}

interface CalorieCalculatorParams {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS = {
  lose: -500,
  maintain: 0,
  gain: 500,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      preferredUnits: 'metric',
      isLoading: false,
      streakDays: 0,

      loadUserPreferences: async () => {
        set({ isLoading: true });
        try {
          const userCollection = database.collections.get<User>('users');
          const users = await userCollection.query().fetch();
          
          if (users.length > 0) {
            const user = users[0];
            set({
              id: user.id,
              age: user.age,
              gender: user.gender,
              height: user.heightCm,
              weight: user.weightKg,
              activityLevel: user.activityLevel,
              goal: user.goal,
              dailyCalorieGoal: user.calorieGoal,
              proteinGoal: user.proteinGoal,
              carbsGoal: user.carbsGoal,
              fatGoal: user.fatGoal,
              preferredUnits: (user.unitPreference as any) || 'metric',
              lastSyncTime: user.updatedAt?.getTime(),
              isLoading: false,
            });
            
            // Calculate streak
            await get().calculateStreak();
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
          set({ isLoading: false });
        }
      },

      updateUserPreferences: async (preferences: Partial<UserPreferences>) => {
        const userCollection = database.collections.get<User>('users');
        
        try {
          await database.write(async () => {
            const users = await userCollection.query().fetch();
            
            if (users.length > 0) {
              const user = users[0];
              await user.update((u: any) => {
                Object.assign(u, {
                  age: preferences.age ?? u.age,
                  gender: preferences.gender ?? u.gender,
                  height: preferences.height ?? u.height,
                  weight: preferences.weight ?? u.weight,
                  activityLevel: preferences.activityLevel ?? u.activityLevel,
                  goal: preferences.goal ?? u.goal,
                  dailyCalorieGoal: preferences.dailyCalorieGoal ?? u.dailyCalorieGoal,
                  proteinGoal: preferences.proteinGoal ?? u.proteinGoal,
                  carbsGoal: preferences.carbsGoal ?? u.carbsGoal,
                  fatGoal: preferences.fatGoal ?? u.fatGoal,
                  preferredUnits: preferences.preferredUnits ?? u.preferredUnits,
                  syncStatus: 'pending',
                });
              });

              // Add to sync queue
              await addToSyncQueue('user', user.id, 'update', preferences);
            }
          });

          // Update local state
          set(preferences);
        } catch (error) {
          console.error('Failed to update user preferences:', error);
          throw error;
        }
      },

      calculateCalorieGoal: (params: CalorieCalculatorParams) => {
        const { age, gender, weight, height, activityLevel, goal } = params;
        
        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr: number;
        if (gender === 'male') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        
        // Apply activity multiplier
        const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
        
        // Apply goal adjustment
        const calorieGoal = Math.round(tdee + GOAL_ADJUSTMENTS[goal]);
        
        return calorieGoal;
      },

      updateMacroGoals: async (proteinPercent: number, carbsPercent: number, fatPercent: number) => {
        const { dailyCalorieGoal } = get();
        
        if (!dailyCalorieGoal) {
          throw new Error('Daily calorie goal not set');
        }
        
        // Validate percentages
        if (proteinPercent + carbsPercent + fatPercent !== 100) {
          throw new Error('Macro percentages must sum to 100');
        }
        
        // Calculate macro goals in grams
        const proteinGoal = Math.round((dailyCalorieGoal * proteinPercent / 100) / 4);
        const carbsGoal = Math.round((dailyCalorieGoal * carbsPercent / 100) / 4);
        const fatGoal = Math.round((dailyCalorieGoal * fatPercent / 100) / 9);
        
        await get().updateUserPreferences({
          proteinGoal,
          carbsGoal,
          fatGoal,
        });
      },

      toggleUnits: async () => {
        const currentUnits = get().preferredUnits;
        const newUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
        
        await get().updateUserPreferences({ preferredUnits: newUnits });
      },

      calculateStreak: async () => {
        try {
          const mealCollection = database.collections.get('meals');
          const now = new Date();
          let streak = 0;
          let currentDate = new Date(now);
          
          // Check backwards from today
          while (true) {
            const startOfDay = new Date(currentDate);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(currentDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            const mealsCount = await mealCollection
              .query(
                // @ts-ignore
                Q.where('meal_date', Q.gte(startOfDay.getTime())),
                // @ts-ignore
                Q.where('meal_date', Q.lte(endOfDay.getTime()))
              )
              .fetchCount();
            
            if (mealsCount > 0) {
              streak++;
              currentDate.setDate(currentDate.getDate() - 1);
            } else {
              break;
            }
            
            // Limit to reasonable streak calculation (e.g., 365 days)
            if (streak >= 365) break;
          }
          
          set({ streakDays: streak });
          return streak;
        } catch (error) {
          console.error('Failed to calculate streak:', error);
          return 0;
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferredUnits: state.preferredUnits,
        dailyCalorieGoal: state.dailyCalorieGoal,
        proteinGoal: state.proteinGoal,
        carbsGoal: state.carbsGoal,
        fatGoal: state.fatGoal,
        age: state.age,
        gender: state.gender,
        height: state.height,
        weight: state.weight,
        activityLevel: state.activityLevel,
        goal: state.goal,
      }),
    }
  )
);

// Utility functions for unit conversions
export const convertWeight = (value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number => {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') return value * 2.20462;
  return value / 2.20462;
};

export const convertHeight = (value: number, from: 'cm' | 'inches', to: 'cm' | 'inches'): number => {
  if (from === to) return value;
  if (from === 'cm' && to === 'inches') return value / 2.54;
  return value * 2.54;
};
