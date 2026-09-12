import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsDateString, IsEnum, IsUUID, ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '../../../generated/prisma/client.js';

class AttendanceEntryDto {
  @IsUUID() studentId: string;
  @IsEnum(AttendanceStatus) status: AttendanceStatus;
}

export class MarkAttendanceDto {
  @IsUUID() courseId: string;
  @IsUUID() semesterId: string;
  @IsDateString() date: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}
