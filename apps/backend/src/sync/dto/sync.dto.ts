import {
  IsArray,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMealDto } from '../../meals/dto/meal.dto';

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export class SyncChange {
  @IsString()
  id: string;

  @IsEnum(SyncAction)
  action: SyncAction;

  @IsString()
  entity: 'meal';

  @IsOptional()
  data?: any;

  @IsDateString()
  timestamp: string;
}

export class PushSyncDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncChange)
  changes: SyncChange[];

  @IsDateString()
  lastSync: string;
}

export class PullSyncDto {
  @IsOptional()
  @IsDateString()
  lastSync?: string;
}
