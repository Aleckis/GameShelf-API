import {
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateLibraryEntryDto {
  @IsOptional()
  @IsIn([
    'WANT_TO_PLAY',
    'PLAYING',
    'COMPLETED',
    'DROPPED',
  ])
  status?: 'WANT_TO_PLAY' | 'PLAYING' | 'COMPLETED' | 'DROPPED';

  @IsOptional()
  @IsInt()
  @Min(0)
  hoursPlayed?: number;
}