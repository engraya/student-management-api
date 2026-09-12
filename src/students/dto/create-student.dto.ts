import {
  IsDateString, IsEmail, IsEnum, IsInt, IsOptional,
  IsString, IsUUID, Length, Min,
} from 'class-validator';
import { Gender } from '../../generated/prisma/client.js';

export class CreateStudentDto {
  @IsString() @Length(3, 20) studentNumber: string;
  @IsString() @Length(2, 50) firstName: string;
  @IsString() @Length(2, 50) lastName: string;
  @IsOptional() @IsString() @Length(2, 50) middleName?: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsDateString() dateOfBirth: string;
  @IsEnum(Gender) gender: Gender;
  @IsUUID() departmentId: string;
  @IsInt() @Min(100) level: number;
  @IsOptional() @IsString() address?: string;
}
