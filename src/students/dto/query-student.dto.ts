import { Type } from 'class-transformer';
import {
  IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min,
} from 'class-validator';
import { Gender, StudentStatus } from '../../generated/prisma/client.js';

export class QueryStudentDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @IsEnum(StudentStatus) status?: StudentStatus;
  @IsOptional() @IsEnum(Gender) gender?: Gender;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;

  @IsOptional()
  @IsIn(['createdAt', 'firstName', 'lastName', 'studentNumber', 'level'])
  sortBy = 'createdAt';

  @IsOptional() @IsIn(['asc', 'desc']) sortOrder: 'asc' | 'desc' = 'desc';
}
