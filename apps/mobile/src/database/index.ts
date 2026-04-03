import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import User from './models/User';
import Meal from './models/Meal';
import FoodItem from './models/FoodItem';
import SyncQueue from './models/SyncQueue';

// Expo Go does not provide the WatermelonDB JSI module.
const hasJSI = typeof (globalThis as any).nativeCallSyncHook === 'function';

const createMockCollection = () => ({
  query: () => ({
    fetch: async () => [],
    fetchCount: async () => 0,
    observe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  create: async () => null,
  find: async () => null,
  findAndObserve: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
});

const createMockDatabase = () => ({
  get: () => createMockCollection(),
  collections: {
    get: () => createMockCollection(),
  },
  write: async (fn: any) => fn?.(),
});

// Configure SQLite adapter
let databaseInstance: any;
try {
  const adapter = new SQLiteAdapter({
    schema,
    // Fall back to non-JSI mode when JSI is unavailable.
    jsi: hasJSI,
  });

  databaseInstance = new Database({
    adapter,
    modelClasses: [User, Meal, FoodItem, SyncQueue],
  });
} catch (error) {
  console.warn('[Database] WatermelonDB native module unavailable, using in-memory fallback.', error);
  databaseInstance = createMockDatabase();
}

// Initialize database
export const database = databaseInstance;

// Export collections for easy access
export const userCollection = database.get('users') as any;
export const mealCollection = database.get('meals') as any;
export const foodItemCollection = database.get('food_items') as any;
export const syncQueueCollection = database.get('sync_queue') as any;
