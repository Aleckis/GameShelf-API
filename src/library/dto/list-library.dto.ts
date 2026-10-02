import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ListLibraryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsIn([
    'WANT_TO_PLAY',
    'PLAYING',
    'COMPLETED',
    'DROPPED',
  ])
  status?: 'WANT_TO_PLAY' | 'PLAYING' | 'COMPLETED' | 'DROPPED';
}