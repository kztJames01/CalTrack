import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import User from './models/User';
import Meal from './models/Meal';
import FoodItem from './models/FoodItem';
import SyncQueue from './models/SyncQueue';

// Configure SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Enable JSI for better performance on iOS/Android
  jsi: true,
  // Migrations will be added here as schema evolves
  migrations: [],
});

// Initialize database
export const database = new Database({
  adapter,
  modelClasses: [User, Meal, FoodItem, SyncQueue],
});

// Export collections for easy access
export const userCollection = database.get<User>('users');
export const mealCollection = database.get<Meal>('meals');
export const foodItemCollection = database.get<FoodItem>('food_items');
export const syncQueueCollection = database.get<SyncQueue>('sync_queue');
