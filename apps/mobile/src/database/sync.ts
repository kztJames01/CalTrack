import { database, syncQueueCollection, userCollection, mealCollection, foodItemCollection } from './index';
import { apiClient } from '../lib/apiClient';
import type { SyncChanges } from '../types';
import User from './models/User';
import Meal from './models/Meal';
import FoodItem from './models/FoodItem';
import SyncQueue from './models/SyncQueue';

const MAX_RETRY_COUNT = 3;
const SYNC_BATCH_SIZE = 50;

/**
 * Main sync - push and pull operations
 */
export async function syncDatabase(): Promise<void> {
  try {
    console.log('[Sync] Starting database sync...');

    // Push local changes to server
    await pushLocalChanges();

    // Pull remote changes from server
    await pullRemoteChanges();

    console.log('[Sync] Database sync completed successfully');
  } catch (error) {
    console.error('[Sync] Database sync failed:', error);
    throw error;
  }
}

/**
 * Push local unsynced changes to the backend
 */
export async function pushLocalChanges(): Promise<void> {
  try {
    console.log('[Sync] Pushing local changes...');

    // Get all pending sync queue items
    const queueItems = await syncQueueCollection.query().fetch();

    if (queueItems.length === 0) {
      console.log('[Sync] No local changes to push');
      return;
    }

    console.log(`[Sync] Found ${queueItems.length} items in sync queue`);

    // Process queue items in batches
    for (let i = 0; i < queueItems.length; i += SYNC_BATCH_SIZE) {
      const batch = queueItems.slice(i, i + SYNC_BATCH_SIZE);
      await processSyncBatch(batch);
    }

    console.log('[Sync] Local changes pushed successfully');
  } catch (error) {
    console.error('[Sync] Failed to push local changes:', error);
    throw error;
  }
}

/**
 * Process a batch of sync queue items
 */
async function processSyncBatch(items: SyncQueue[]): Promise<void> {
  for (const item of items) {
    try {
      await processSyncItem(item);
      
      // Remove from queue after successful sync
      await database.write(async () => {
        await item.destroyPermanently();
      });
    } catch (error) {
      console.error(`[Sync] Failed to process item ${item.id}:`, error);
      
      // Increment retry count
      await database.write(async () => {
        await item.update((record) => {
          record.retryCount += 1;
        });
      });

      // Remove from queue if max retries exceeded
      if (item.retryCount >= MAX_RETRY_COUNT) {
        console.warn(`[Sync] Max retries exceeded for item ${item.id}, removing from queue`);
        await database.write(async () => {
          await item.destroyPermanently();
        });
      }
    }
  }
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueue): Promise<void> {
  const { recordType, recordId, operation, parsedPayload } = item;

  console.log(`[Sync] Processing ${operation} for ${recordType}:${recordId}`);

  switch (recordType) {
    case 'user':
      await syncUserData(recordId, operation, parsedPayload);
      break;
    case 'meal':
      await syncMeal(recordId, operation, parsedPayload);
      break;
    case 'foodItem':
      await syncFoodItem(recordId, operation, parsedPayload);
      break;
    default:
      console.warn(`[Sync] Unknown record type: ${recordType}`);
  }
}

/**
 * Sync user data to backend
 */
async function syncUserData(recordId: string, operation: string, payload: any): Promise<void> {
  if (operation === 'update') {
    await apiClient.put(`/users/${recordId}`, payload);
    await updateRecordSyncStatus('users', recordId);
  }
}

/**
 * Sync meal to backend
 */
async function syncMeal(recordId: string, operation: string, payload: any): Promise<void> {
  switch (operation) {
    case 'create':
      const createResponse = await apiClient.post('/meals', payload);
      await updateRecordSyncStatus('meals', recordId, createResponse.data.id);
      break;
    case 'update':
      await apiClient.put(`/meals/${recordId}`, payload);
      await updateRecordSyncStatus('meals', recordId);
      break;
    case 'delete':
      await apiClient.delete(`/meals/${recordId}`);
      break;
  }
}

/**
 * Sync food item to backend
 */
async function syncFoodItem(recordId: string, operation: string, payload: any): Promise<void> {
  switch (operation) {
    case 'create':
      const createResponse = await apiClient.post('/meals/food-items', payload);
      await updateRecordSyncStatus('food_items', recordId, createResponse.data.id);
      break;
    case 'update':
      await apiClient.put(`/meals/food-items/${recordId}`, payload);
      await updateRecordSyncStatus('food_items', recordId);
      break;
    case 'delete':
      await apiClient.delete(`/meals/food-items/${recordId}`);
      break;
  }
}

/**
 * Pull remote changes from the backend
 */
export async function pullRemoteChanges(): Promise<void> {
  try {
    console.log('[Sync] Pulling remote changes...');

    // Get last sync timestamp
    const lastSync = await getLastSyncTimestamp();
    
    // Fetch changes from server
    const response = await apiClient.get<SyncChanges>('/sync/changes', {
      params: { since: lastSync?.toISOString() },
    });

    const { users, meals, foodItems } = response.data;

    console.log(`[Sync] Received ${users.length} users, ${meals.length} meals, ${foodItems.length} food items`);

    // Apply changes to local database
    await database.write(async () => {
      // Update users
      for (const userData of users) {
        await upsertUser(userData);
      }

      // Update meals
      for (const mealData of meals) {
        await upsertMeal(mealData);
      }

      // Update food items
      for (const foodItemData of foodItems) {
        await upsertFoodItem(foodItemData);
      }
    });

    // Update last sync timestamp
    await updateLastSyncTimestamp();

    console.log('[Sync] Remote changes applied successfully');
  } catch (error) {
    console.error('[Sync] Failed to pull remote changes:', error);
    throw error;
  }
}

/**
 * Upsert user record
 */
async function upsertUser(userData: any): Promise<void> {
  const existing = await userCollection.find(userData.id).catch(() => null);

  if (existing) {
    await existing.update((user) => {
      Object.assign(user, {
        email: userData.email,
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        heightCm: userData.heightCm,
        weightKg: userData.weightKg,
        activityLevel: userData.activityLevel,
        goal: userData.goal,
        calorieGoal: userData.calorieGoal,
        proteinGoal: userData.proteinGoal,
        carbsGoal: userData.carbsGoal,
        fatGoal: userData.fatGoal,
        unitPreference: userData.unitPreference,
        isSynced: true,
      });
    });
  } else {
    await userCollection.create((user) => {
      user._raw.id = userData.id;
      Object.assign(user, {
        email: userData.email,
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        heightCm: userData.heightCm,
        weightKg: userData.weightKg,
        activityLevel: userData.activityLevel,
        goal: userData.goal,
        calorieGoal: userData.calorieGoal,
        proteinGoal: userData.proteinGoal,
        carbsGoal: userData.carbsGoal,
        fatGoal: userData.fatGoal,
        unitPreference: userData.unitPreference,
        isSynced: true,
      });
    });
  }
}

/**
 * Upsert meal record
 */
async function upsertMeal(mealData: any): Promise<void> {
  const existing = await mealCollection.find(mealData.id).catch(() => null);

  if (existing) {
    await existing.update((meal) => {
      Object.assign(meal, {
        userId: mealData.userId,
        name: mealData.name,
        mealType: mealData.mealType,
        date: new Date(mealData.date),
        totalCalories: mealData.totalCalories,
        totalProtein: mealData.totalProtein,
        totalCarbs: mealData.totalCarbs,
        totalFat: mealData.totalFat,
        totalFiber: mealData.totalFiber,
        totalSugar: mealData.totalSugar,
        totalSodium: mealData.totalSodium,
        isSynced: true,
      });
    });
  } else {
    await mealCollection.create((meal) => {
      meal._raw.id = mealData.id;
      Object.assign(meal, {
        userId: mealData.userId,
        name: mealData.name,
        mealType: mealData.mealType,
        date: new Date(mealData.date),
        totalCalories: mealData.totalCalories,
        totalProtein: mealData.totalProtein,
        totalCarbs: mealData.totalCarbs,
        totalFat: mealData.totalFat,
        totalFiber: mealData.totalFiber,
        totalSugar: mealData.totalSugar,
        totalSodium: mealData.totalSodium,
        isSynced: true,
      });
    });
  }
}

/**
 * Upsert food item record
 */
async function upsertFoodItem(foodItemData: any): Promise<void> {
  const existing = await foodItemCollection.find(foodItemData.id).catch(() => null);

  if (existing) {
    await existing.update((foodItem) => {
      Object.assign(foodItem, {
        mealId: foodItemData.mealId,
        name: foodItemData.name,
        brandName: foodItemData.brandName,
        servingSize: foodItemData.servingSize,
        servingUnit: foodItemData.servingUnit,
        calories: foodItemData.calories,
        protein: foodItemData.protein,
        carbs: foodItemData.carbs,
        fat: foodItemData.fat,
        fiber: foodItemData.fiber,
        sugar: foodItemData.sugar,
        sodium: foodItemData.sodium,
        barcode: foodItemData.barcode,
        photoUrl: foodItemData.photoUrl,
        portion: foodItemData.portion,
        isSynced: true,
      });
    });
  } else {
    await foodItemCollection.create((foodItem) => {
      foodItem._raw.id = foodItemData.id;
      Object.assign(foodItem, {
        mealId: foodItemData.mealId,
        name: foodItemData.name,
        brandName: foodItemData.brandName,
        servingSize: foodItemData.servingSize,
        servingUnit: foodItemData.servingUnit,
        calories: foodItemData.calories,
        protein: foodItemData.protein,
        carbs: foodItemData.carbs,
        fat: foodItemData.fat,
        fiber: foodItemData.fiber,
        sugar: foodItemData.sugar,
        sodium: foodItemData.sodium,
        barcode: foodItemData.barcode,
        photoUrl: foodItemData.photoUrl,
        portion: foodItemData.portion,
        isSynced: true,
      });
    });
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  recordType: 'user' | 'meal' | 'foodItem',
  recordId: string,
  operation: 'create' | 'update' | 'delete',
  payload: any
): Promise<void> {
  await database.write(async () => {
    await syncQueueCollection.create((item) => {
      item.recordType = recordType;
      item.recordId = recordId;
      item.operation = operation;
      item.payload = JSON.stringify(payload);
      item.retryCount = 0;
    });
  });

  console.log(`[Sync] Added ${recordType}:${recordId} to sync queue`);
}

/**
 * Update record sync status
 */
async function updateRecordSyncStatus(
  tableName: string,
  recordId: string,
  newId?: string
): Promise<void> {
  await database.write(async () => {
    const collection = database.get(tableName);
    const record = await collection.find(recordId);
    
    await record.update((r: any) => {
      if (newId) {
        r._raw.id = newId;
      }
      r.isSynced = true;
    });
  });
}

/**
 * Get last sync timestamp from AsyncStorage
 */
async function getLastSyncTimestamp(): Promise<Date | null> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const timestamp = await AsyncStorage.getItem('lastSyncTimestamp');
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
}

/**
 * Update last sync timestamp
 */
async function updateLastSyncTimestamp(): Promise<void> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.setItem('lastSyncTimestamp', new Date().toISOString());
  } catch (error) {
    console.error('[Sync] Failed to update last sync timestamp:', error);
  }
}

/**
 * Get pending sync queue count
 */
export async function getPendingSyncCount(): Promise<number> {
  const queueItems = await syncQueueCollection.query().fetch();
  return queueItems.length;
}

/**
 * Clear sync queue (use with caution)
 */
export async function clearSyncQueue(): Promise<void> {
  await database.write(async () => {
    const queueItems = await syncQueueCollection.query().fetch();
    for (const item of queueItems) {
      await item.destroyPermanently();
    }
  });
  console.log('[Sync] Sync queue cleared');
}
