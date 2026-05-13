import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { MlTrainingExportService } from './ml-training-export.service';

@Module({
  imports: [ConfigModule],
  controllers: [NutritionController],
  providers: [NutritionService, MlTrainingExportService],
  exports: [NutritionService],
})
export class NutritionModule {}
