// User and Authentication Types
export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'lose' | 'maintain' | 'gain';
  units?: 'metric' | 'imperial';
}

export interface UserGoals {
  userId: string;
  dailyCalories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
}

// Nutrition Types
export interface NutritionalData {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  servingSize: string;
  servingUnit: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brandName?: string;
  barcode?: string;
  nutrition: NutritionalData;
  photoUrl?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  userId: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: MealFoodItem[];
  totalNutrition: NutritionalData;
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealFoodItem {
  foodId: string;
  foodName: string;
  servings: number;
  nutrition: NutritionalData;
}

// API Request/Response Types
export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthRegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface FoodSearchRequest {
  query: string;
  limit?: number;
}

export interface FoodSearchResponse {
  foods: FoodItem[];
  total: number;
}

export interface BarcodeScanRequest {
  upc: string;
}

export interface PhotoAnalysisRequest {
  imageUrl: string;
}

export interface PhotoAnalysisResponse {
  detectedFoods: DetectedFood[];
}

export interface DetectedFood {
  name: string;
  confidence: number;
  suggestedFoods: FoodItem[];
}

export interface CreateMealRequest {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: {
    foodId: string;
    servings: number;
  }[];
  timestamp?: Date;
  notes?: string;
}

export interface UpdateMealRequest {
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods?: {
    foodId: string;
    servings: number;
  }[];
  notes?: string;
}

export interface DailyTotalsRequest {
  date: string; // YYYY-MM-DD
}

export interface DailyTotalsResponse {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
  goals: UserGoals;
  remainingCalories: number;
}

// Sync Types
export interface SyncPayload {
  meals: {
    created: Meal[];
    updated: Meal[];
    deleted: string[];
  };
  foods: {
    created: FoodItem[];
    updated: FoodItem[];
    deleted: string[];
  };
  lastSyncTimestamp: Date;
}

export interface SyncResponse {
  meals: Meal[];
  foods: FoodItem[];
  serverTimestamp: Date;
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Helper Types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Units = 'metric' | 'imperial';
