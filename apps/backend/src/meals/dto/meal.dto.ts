import {
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../../database/entities';

export class FoodItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsNumber()
  @Min(0)
  calories: number;

  @IsNumber()
  @Min(0)
  protein: number;

  @IsNumber()
  @Min(0)
  carbs: number;

  @IsNumber()
  @Min(0)
  fat: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sugar?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sodium?: number;

  @IsString()
  servingSize: string;

  @IsString()
  servingUnit: string;

  @IsNumber()
  @Min(0.1)
  quantity: number;

  @IsBoolean()
  isCustom: boolean;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class CreateMealDto {
  @IsEnum(MealType)
  type: MealType;

  @IsDateString()
  eatenAt: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  foodItems: FoodItemDto[];
}

export class UpdateMealDto {
  @IsOptional()
  @IsEnum(MealType)
  type?: MealType;

  @IsOptional()
  @IsDateString()
  eatenAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodItemDto)
  foodItems?: FoodItemDto[];
}

export class QueryMealsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(MealType)
  type?: MealType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}
