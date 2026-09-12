import { IsOptional, IsUUID } from 'class-validator';

export class QueryResultDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() semesterId?: string;
}
