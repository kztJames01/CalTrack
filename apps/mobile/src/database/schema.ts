import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Users table
    tableSchema({
      name: 'users',
      columns: [
        { name: 'email', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'height_cm', type: 'number', isOptional: true },
        { name: 'weight_kg', type: 'number', isOptional: true },
        { name: 'activity_level', type: 'string', isOptional: true },
        { name: 'goal', type: 'string', isOptional: true },
        { name: 'calorie_goal', type: 'number', isOptional: true },
        { name: 'protein_goal', type: 'number', isOptional: true },
        { name: 'carbs_goal', type: 'number', isOptional: true },
        { name: 'fat_goal', type: 'number', isOptional: true },
        { name: 'unit_preference', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Meals table
    tableSchema({
      name: 'meals',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'meal_type', type: 'string', isIndexed: true },
        { name: 'date', type: 'number', isIndexed: true },
        { name: 'total_calories', type: 'number' },
        { name: 'total_protein', type: 'number' },
        { name: 'total_carbs', type: 'number' },
        { name: 'total_fat', type: 'number' },
        { name: 'total_fiber', type: 'number', isOptional: true },
        { name: 'total_sugar', type: 'number', isOptional: true },
        { name: 'total_sodium', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Food items table
    tableSchema({
      name: 'food_items',
      columns: [
        { name: 'meal_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string', isIndexed: true },
        { name: 'brand_name', type: 'string', isOptional: true },
        { name: 'serving_size', type: 'number' },
        { name: 'serving_unit', type: 'string' },
        { name: 'calories', type: 'number' },
        { name: 'protein', type: 'number' },
        { name: 'carbs', type: 'number' },
        { name: 'fat', type: 'number' },
        { name: 'fiber', type: 'number', isOptional: true },
        { name: 'sugar', type: 'number', isOptional: true },
        { name: 'sodium', type: 'number', isOptional: true },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'photo_url', type: 'string', isOptional: true },
        { name: 'portion', type: 'number' },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // Sync queue table
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'record_type', type: 'string', isIndexed: true },
        { name: 'record_id', type: 'string', isIndexed: true },
        { name: 'operation', type: 'string' },
        { name: 'payload', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
