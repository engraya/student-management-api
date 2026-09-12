import { PartialType } from '@nestjs/swagger';
import { CreateFacultyDto } from './create-faculty.dto.js';

export class UpdateFacultyDto extends PartialType(CreateFacultyDto) {}
