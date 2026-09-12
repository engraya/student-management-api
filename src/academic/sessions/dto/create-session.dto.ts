import { IsDateString, IsString, Length } from 'class-validator';

export class CreateSessionDto {
  @IsString() @Length(4, 20) name: string; // e.g. "2025/2026"
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}
