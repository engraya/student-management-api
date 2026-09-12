import { IsUUID } from 'class-validator';

export class CreateRegistrationDto {
  @IsUUID() studentId: string;
  @IsUUID() courseId: string;
  @IsUUID() semesterId: string;
}
