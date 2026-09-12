import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GpaService } from './gpa.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';

@ApiTags('Academic — GPA / CGPA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic/students/:studentId')
export class GpaController {
  constructor(private readonly gpaService: GpaService) {}

  @Get('gpa')
  getGpa(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('semesterId', ParseUUIDPipe) semesterId: string,
  ) {
    return this.gpaService.getSemesterGpa(studentId, semesterId);
  }

  @Get('cgpa')
  getCgpa(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.gpaService.getCgpa(studentId);
  }
}
