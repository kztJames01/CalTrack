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
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
