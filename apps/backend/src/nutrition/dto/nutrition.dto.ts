import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class SearchFoodDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

export class AnalyzePhotoDto {
  @IsString()
  imageUrl: string;
}
