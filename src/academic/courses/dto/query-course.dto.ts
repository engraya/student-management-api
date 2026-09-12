import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SemesterName } from '../../../generated/prisma/client.js';

export class QueryCourseDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(100) level?: number;
  @IsOptional() @IsEnum(SemesterName) semesterName?: SemesterName;
}
