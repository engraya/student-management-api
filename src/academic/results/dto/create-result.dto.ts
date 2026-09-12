import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class CreateResultDto {
  @IsUUID() studentId: string;
  @IsUUID() courseId: string;
  @IsUUID() semesterId: string;
  @IsNumber() @Min(0) @Max(30) caScore: number;
  @IsNumber() @Min(0) @Max(70) examScore: number;
}
