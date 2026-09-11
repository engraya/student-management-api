import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { QueryStudentDto } from './dto/query-student.dto.js';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDepartment(name: string) {
    const department = await this.prisma.department.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async create(dto: CreateStudentDto) {
    try {
      const department = await this.getDepartment(dto.department);

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
          department: {
            connect: { id: department.id },
          },
          level: dto.level,
          address: dto.address,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Student number or email already exists',
        );
      }

      throw error;
    }
  }

  async findAll(query: QueryStudentDto) {
    const {
      search,
      department,
      status,
      gender,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const allowedSortFields = [
      'createdAt',
      'firstName',
      'lastName',
      'studentNumber',
      'department',
      'level',
    ];

    if (!allowedSortFields.includes(sortBy)) {
      throw new BadRequestException('Invalid sortBy field');
    }

    if (!['asc', 'desc'].includes(sortOrder)) {
      throw new BadRequestException('Invalid sortOrder');
    }

    const where: Prisma.StudentWhereInput = {
      ...(department && {
        department: {
          is: {
            name: {
              contains: department,
              mode: 'insensitive',
            },
          },
        },
      }),

      ...(status && { status }),

      ...(gender && { gender }),

      ...(search && {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            studentNumber: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const skip = (page - 1) * limit;

    const [students, total] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === 'department'
            ? { department: { name: sortOrder as Prisma.SortOrder } }
            : { [sortBy]: sortOrder },
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);

    try {
      return await this.prisma.student.update({
        where: { id },
        data: {
          ...(dto.studentNumber !== undefined && {
            studentNumber: dto.studentNumber,
          }),
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName,
          }),
          ...(dto.lastName !== undefined && {
            lastName: dto.lastName,
          }),
          ...(dto.middleName !== undefined && {
            middleName: dto.middleName,
          }),
          ...(dto.email !== undefined && {
            email: dto.email.toLowerCase(),
          }),
          ...(dto.phone !== undefined && {
            phone: dto.phone,
          }),
          ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: new Date(dto.dateOfBirth),
          }),
          ...(dto.gender !== undefined && {
            gender: dto.gender,
          }),
          ...(dto.department !== undefined && {
            department: {
              connect: { id: (await this.getDepartment(dto.department)).id },
            },
          }),
          ...(dto.level !== undefined && {
            level: dto.level,
          }),
          ...(dto.address !== undefined && {
            address: dto.address,
          }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Student number or email already exists',
        );
      }

      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.student.delete({
      where: { id },
    });

    return {
      message: 'Student deleted successfully',
    };
  }
}
