import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { SemesterName } from '../../../generated/prisma/client.js';

export class CreateCourseDto {
  @IsString() @Length(3, 15) code: string;
  @IsString() @Length(2, 150) title: string;
  @IsOptional() @IsString() description?: string;
  @IsInt() @Min(1) creditUnits: number;
  @IsInt() @Min(100) level: number;
  @IsEnum(SemesterName) semesterName: SemesterName;
  @IsOptional() @IsBoolean() isElective?: boolean;
  @IsUUID() departmentId: string;
}
