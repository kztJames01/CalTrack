
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class SyncQueue extends Model {
  static table = 'sync_queue';

  @field('record_type') recordType!: 'user' | 'meal' | 'foodItem';
  @field('record_id') recordId!: string;
  @field('operation') operation!: 'create' | 'update' | 'delete';
  @field('payload') payload!: string; // JSON stringified data
  @field('retry_count') retryCount!: number;
  
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get parsedPayload(): any {
    try {
      return JSON.parse(this.payload);
    } catch {
      return null;
    }
  }
}
