import { IsOptional, IsUUID } from 'class-validator';

export class QueryDepartmentDto {
  @IsOptional() @IsUUID() facultyId?: string;
}
