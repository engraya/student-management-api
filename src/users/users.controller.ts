import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { ChangeUserRoleDto } from './dto/change-user-role.dto.js';
import { ChangeUserStatusDto } from './dto/change-user-status.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto, @Req() req: Request) {
    return this.usersService.create(dto, req.user?.['userId']);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    return this.usersService.update(id, dto, req.user?.['userId']);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.usersService.remove(id, req.user?.['userId']);
  }

  @Patch(':id/role')
  @Roles('ADMIN')
  changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeUserRoleDto,
    @Req() req: Request,
  ) {
    return this.usersService.changeRole(id, dto, req.user?.['userId']);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeUserStatusDto,
    @Req() req: Request,
  ) {
    return this.usersService.changeStatus(id, dto, req.user?.['userId']);
  }

  @Post('me/change-password')
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user?.['userId'], dto);
  }
}
