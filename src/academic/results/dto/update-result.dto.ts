import { IsNumber, Max, Min } from 'class-validator';

export class UpdateResultDto {
  @IsNumber() @Min(0) @Max(30) caScore: number;
  @IsNumber() @Min(0) @Max(70) examScore: number;
}
