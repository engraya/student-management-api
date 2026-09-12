import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueryAttendanceDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @IsDateString() date?: string;
}
