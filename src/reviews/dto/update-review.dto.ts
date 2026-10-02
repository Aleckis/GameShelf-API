import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateReviewDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @ValidateIf(
    (_object, value) =>
      value !== undefined && value !== null,
  )
  @IsString()
  @MaxLength(2000)
  comment?: string | null;
}