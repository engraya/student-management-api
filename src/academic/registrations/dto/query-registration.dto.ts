import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RegistrationStatus } from '../../../generated/prisma/client.js';

export class QueryRegistrationDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() semesterId?: string;
  @IsOptional() @IsEnum(RegistrationStatus) status?: RegistrationStatus;
}
