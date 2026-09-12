import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCourseDto } from './dto/create-course.dto.js';
import { UpdateCourseDto } from './dto/update-course.dto.js';
import { QueryCourseDto } from './dto/query-course.dto.js';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    try {
      return await this.prisma.course.create({ data: dto, include: { department: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Course code already exists');
      }
      throw error;
    }
  }

  findAll(query: QueryCourseDto) {
    const { search, departmentId, level, semesterName } = query;
    return this.prisma.course.findMany({
      where: {
        ...(departmentId && { departmentId }),
        ...(level && { level }),
        ...(semesterName && { semesterName }),
        ...(search && {
          OR: [
            { code: { contains: search, mode: 'insensitive' } },
            { title: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
      include: { department: true },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    await this.findOne(id);
    try {
      return await this.prisma.course.update({ where: { id }, data: dto, include: { department: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Course code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted successfully' };
  }
}
