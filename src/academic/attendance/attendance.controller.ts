import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AttendanceService } from './attendance.service.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

type AuthedRequest = Request & { user: { userId: string } };

@ApiTags('Academic — Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('attendance')
  @Roles('ADMIN', 'STAFF')
  mark(@Body() dto: MarkAttendanceDto, @Req() req: AuthedRequest) {
    return this.attendanceService.mark(dto, req.user.userId);
  }

  @Get('attendance')
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('students/:studentId/attendance-summary')
  getSummary(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.attendanceService.getStudentSummary(studentId, courseId);
  }
}
