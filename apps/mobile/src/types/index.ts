//Shared types
// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  goal?: Goal;
  calorieGoal?: number;
  proteinGoal?: number;
  carbsGoal?: number;
  fatGoal?: number;
  unitPreference?: 'metric' | 'imperial';
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserPreferences {
  unitPreference: 'metric' | 'imperial';
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

// Meal Types


export interface Meal {
  id: string;
  userId: string;
  name: string;
  mealType: MealType;
  date: Date;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
  foodItems?: FoodItem[];
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
//Food Item Types
export interface FoodItem {
  id: string;
  mealId: string;
  name: string;
  brandName?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  barcode?: string;
  photoUrl?: string;
  portion: number;
  isSynced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Nutrition Types
export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface MacroPercentages {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyTotals extends NutritionInfo {
  date: Date;
  mealCount: number;
}

// API Response Types
export interface FoodSearchResult {
  id?: string;
  name: string;
  brandName?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  barcode?: string;
}

export interface BarcodeResult {
  found: boolean;
  food?: FoodSearchResult;
  message?: string;
}

export interface PhotoDetectionResult {
  foods: DetectedFood[];
  confidence: number;
}

export interface DetectedFood {
  name: string;
  confidence: number;
  nutrition: NutritionInfo;
}

// Sync Types
export interface SyncQueue {
  id: string;
  recordType: 'user' | 'meal' | 'foodItem';
  recordId: string;
  operation: 'create' | 'update' | 'delete';
  payload: any;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncChanges {
  users: User[];
  meals: Meal[];
  foodItems: FoodItem[];
  lastSyncedAt: Date;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface FoodSearchProps {
  onSelect: (food: FoodSearchResult) => void;
  placeholder?: string;
  onClose?: () => void;
}

export interface CustomFoodFormProps {
  onSubmit: (food: FoodSearchResult) => void;
  onCancel: () => void;
  initialData?: Partial<FoodSearchResult>;
}

export interface MealLoggerProps {
  date?: Date;
  mealType?: MealType;
  onComplete?: () => void;
}

export interface PortionSelectorProps {
  initialPortion: number;
  onPortionChange: (portion: number) => void;
  servingUnit: string;
}

export interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export interface ProgressRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export interface MealCardProps {
  meal: Meal;
  onEdit?: (meal: Meal) => void;
  onDelete?: (mealId: string) => void;
  onCopy?: (meal: Meal) => void;
}

export interface FoodItemCardProps {
  foodItem: FoodItem;
  onEdit?: (foodItem: FoodItem) => void;
  onDelete?: (foodItemId: string) => void;
}
//Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface ProfileFormData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

export interface MacroGoalsFormData {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
}
//Utility Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterOptions {
  searchQuery?: string;
  dateRange?: DateRange;
  mealType?: MealType;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

  //Constants

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
  { value: 'light', label: 'Lightly Active (1-3 days/week)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately Active (3-5 days/week)', multiplier: 1.55 },
  { value: 'active', label: 'Very Active (6-7 days/week)', multiplier: 1.725 },
  { value: 'very_active', label: 'Extra Active (athletes)', multiplier: 1.9 },
];

export const GOALS: { value: Goal; label: string; adjustment: number }[] = [
  { value: 'lose', label: 'Lose Weight', adjustment: -500 },
  { value: 'maintain', label: 'Maintain Weight', adjustment: 0 },
  { value: 'gain', label: 'Gain Weight', adjustment: 500 },
];

export const SERVING_UNITS = [
  'g',
  'oz',
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'serving',
  'piece',
  'slice',
  'item',
] as const;

export type ServingUnit = typeof SERVING_UNITS[number];
