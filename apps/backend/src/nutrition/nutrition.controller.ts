import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { SearchFoodDto, AnalyzePhotoDto } from './dto/nutrition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('nutrition')
@UseGuards(JwtAuthGuard)
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('search')
  async searchFood(@Query() searchDto: SearchFoodDto) {
    return this.nutritionService.searchFood(searchDto.query, searchDto.limit);
  }

  @Get('barcode/:upc')
  async getFoodByBarcode(@Param('upc') upc: string) {
    return this.nutritionService.getFoodByBarcode(upc);
  }

  @Get('details/:foodName')
  async getNutritionDetails(@Param('foodName') foodName: string) {
    return this.nutritionService.getNutritionDetails(foodName);
  }

  @Post('analyze-photo')
  async analyzePhoto(@Body() analyzeDto: AnalyzePhotoDto) {
    const imageUrl = analyzeDto.imageUrl ?? analyzeDto.photoUrl;
    if (!imageUrl?.trim()) {
      throw new BadRequestException('imageUrl or photoUrl is required');
    }
    const result = await this.nutritionService.analyzeFoodPhoto(imageUrl.trim());
    return this.nutritionService.toAnalyzePhotoApiBody(result);
  }
}
