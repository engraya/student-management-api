import { IsString, IsUUID, Length } from 'class-validator';

export class CreateDepartmentDto {
  @IsString() @Length(2, 100) name: string;
  @IsString() @Length(2, 10) code: string;
  @IsUUID() facultyId: string;
}
