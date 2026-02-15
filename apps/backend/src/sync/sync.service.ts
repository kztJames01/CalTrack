import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Meal, FoodItem } from '../database/entities';
import { MealsService } from '../meals/meals.service';
import { PushSyncDto, SyncChange, SyncAction } from './dto/sync.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(Meal)
    private mealRepository: Repository<Meal>,
    private mealsService: MealsService,
  ) {}

  async pushChanges(userId: string, pushSyncDto: PushSyncDto) {
    const { changes, lastSync } = pushSyncDto;

    const results: {
      successful: string[];
      failed: Array<{ id: string; error: string }>;
      conflicts: Array<{ id: string; message: string }>;
    } = {
      successful: [],
      failed: [],
      conflicts: [],
    };

    for (const change of changes) {
      try {
        await this.applyChange(userId, change, new Date(lastSync));
        results.successful.push(change.id);
      } catch (error) {
        if (error instanceof ConflictException) {
          results.conflicts.push({
            id: change.id,
            message: error.message,
          });
        } else {
          results.failed.push({
            id: change.id,
            error: error.message,
          });
        }
        this.logger.error(`Sync change failed for ${change.id}: ${error.message}`);
      }
    }

    return {
      ...results,
      timestamp: new Date().toISOString(),
    };
  }

  async pullChanges(userId: string, lastSync?: string) {
    const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);

    // Get all meals updated since last sync
    const meals = await this.mealRepository.find({
      where: {
        userId,
        updatedAt: MoreThan(lastSyncDate),
      },
      relations: ['foodItems'],
      order: {
        updatedAt: 'ASC',
      },
    });

    const changes = meals.map((meal) => ({
      id: meal.id,
      action: SyncAction.UPDATE,
      entity: 'meal',
      data: meal,
      timestamp: meal.updatedAt.toISOString(),
    }));

    return {
      changes,
      timestamp: new Date().toISOString(),
      hasMore: false, // Could implement pagination if needed
    };
  }

  private async applyChange(
    userId: string,
    change: SyncChange,
    lastSync: Date,
  ): Promise<void> {
    switch (change.action) {
      case SyncAction.CREATE:
        await this.handleCreate(userId, change);
        break;
      case SyncAction.UPDATE:
        await this.handleUpdate(userId, change, lastSync);
        break;
      case SyncAction.DELETE:
        await this.handleDelete(userId, change);
        break;
      default:
        throw new BadRequestException(`Unknown action: ${change.action}`);
    }
  }

  private async handleCreate(userId: string, change: SyncChange): Promise<void> {
    // Check if meal already exists (handle duplicate syncs)
    const existingMeal = await this.mealRepository.findOne({
      where: { id: change.id },
    });

    if (existingMeal) {
      // If it exists and belongs to the user, update it instead
      if (existingMeal.userId === userId) {
        await this.handleUpdate(userId, change, new Date(0));
        return;
      }
      throw new ConflictException('Meal already exists with different owner');
    }

    // Create new meal with the provided ID from mobile
    const meal = this.mealRepository.create({
      id: change.id,
      userId,
      ...change.data,
      syncedAt: new Date(),
    });

    await this.mealRepository.save(meal);
  }

  private async handleUpdate(
    userId: string,
    change: SyncChange,
    lastSync: Date,
  ): Promise<void> {
    const meal = await this.mealRepository.findOne({
      where: { id: change.id },
      relations: ['foodItems'],
    });

    if (!meal) {
      // If meal doesn't exist, treat as create
      await this.handleCreate(userId, change);
      return;
    }

    if (meal.userId !== userId) {
      throw new ConflictException('Meal belongs to different user');
    }

    // Conflict detection: last-write-wins strategy
    if (meal.updatedAt > lastSync && meal.syncedAt && meal.syncedAt > lastSync) {
      this.logger.warn(
        `Conflict detected for meal ${change.id}, applying last-write-wins`,
      );
    }

    // Update meal
    Object.assign(meal, change.data);
    meal.syncedAt = new Date();

    await this.mealRepository.save(meal);
  }

  private async handleDelete(userId: string, change: SyncChange): Promise<void> {
    const meal = await this.mealRepository.findOne({
      where: { id: change.id },
    });

    if (!meal) {
      // Already deleted, no action needed
      return;
    }

    if (meal.userId !== userId) {
      throw new ConflictException('Meal belongs to different user');
    }

    await this.mealRepository.remove(meal);
  }

  async getLastSyncTimestamp(userId: string): Promise<string> {
    const latestMeal = await this.mealRepository.findOne({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });

    return latestMeal ? latestMeal.updatedAt.toISOString() : new Date(0).toISOString();
  }
}
