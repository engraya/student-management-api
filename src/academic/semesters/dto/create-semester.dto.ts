import { IsDateString, IsEnum, IsUUID } from 'class-validator';
import { SemesterName } from '../../../generated/prisma/client.js';

export class CreateSemesterDto {
  @IsEnum(SemesterName) name: SemesterName;
  @IsUUID() sessionId: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}
