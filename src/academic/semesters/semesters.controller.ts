import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SemestersService } from './semesters.service.js';
import { CreateSemesterDto } from './dto/create-semester.dto.js';
import { UpdateSemesterDto } from './dto/update-semester.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';

@ApiTags('Academic — Semesters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academic/semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Get()
  findAll(@Query('sessionId') sessionId?: string) {
    return this.semestersService.findAll(sessionId);
  }

  @Get('current')
  findCurrent() {
    return this.semestersService.findCurrent();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.semestersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateSemesterDto) {
    return this.semestersService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSemesterDto) {
    return this.semestersService.update(id, dto);
  }

  @Patch(':id/set-current')
  @Roles('ADMIN')
  setCurrent(@Param('id', ParseUUIDPipe) id: string) {
    return this.semestersService.setCurrent(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.semestersService.remove(id);
  }
}
