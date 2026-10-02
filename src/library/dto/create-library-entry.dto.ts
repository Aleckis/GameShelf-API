import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class CreateLibraryEntryDto {
  @IsInt()
  @Min(1)
  gameId: number;

  @IsOptional()
  @IsIn([
    'WANT_TO_PLAY',
    'PLAYING',
    'COMPLETED',
    'DROPPED',
  ])
  status?: 'WANT_TO_PLAY' | 'PLAYING' | 'COMPLETED' | 'DROPPED';
}