import {
  ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { QueryStudentDto } from './dto/query-student.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    try {
      return await this.prisma.student.create({
        data: {
          studentNumber: dto.studentNumber,
          firstName: dto.firstName,
          lastName: dto.lastName,
          middleName: dto.middleName,
          email: dto.email.toLowerCase(),
          phone: dto.phone,
          dateOfBirth: new Date(dto.dateOfBirth),
          gender: dto.gender,
          departmentId: dto.departmentId,
          level: dto.level,
          address: dto.address,
        },
        include: { department: { include: { faculty: true } } },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Student number or email already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryStudentDto) {
    const {
      search, departmentId, status, gender,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const where: Prisma.StudentWhereInput = {
      ...(departmentId && { departmentId }),
      ...(status && { status }),
      ...(gender && { gender }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { department: true },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data,
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { department: { include: { faculty: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...(dto.studentNumber !== undefined && { studentNumber: dto.studentNumber }),
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.middleName !== undefined && { middleName: dto.middleName }),
          ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
          ...(dto.level !== undefined && { level: dto.level }),
          ...(dto.address !== undefined && { address: dto.address }),
        },
        include: { department: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Student number or email already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.student.delete({ where: { id } });
    return { message: 'Student deleted successfully' };
  }
}
