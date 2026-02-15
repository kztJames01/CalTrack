import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { MealsModule } from '../meals/meals.module';
import { Meal, FoodItem } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Meal, FoodItem]), MealsModule],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
