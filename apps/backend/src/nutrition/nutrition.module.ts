import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NutritionService } from './nutrition.service';
import { NutritionController } from './nutrition.controller';
import { MlTrainingExportService } from './ml-training-export.service';
import { UsdaService } from './usda.service';

@Module({
  imports: [ConfigModule],
  controllers: [NutritionController],
  providers: [NutritionService, MlTrainingExportService, UsdaService],
  exports: [NutritionService],
})
export class NutritionModule {}
