import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RegistrationStatus } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { QueryRegistrationDto } from './dto/query-registration.dto.js';

const registrationInclude = {
  student: { select: { id: true, studentNumber: true, firstName: true, lastName: true } },
  course: true,
  semester: { include: { session: true } },
} as const;

@Injectable()
export class RegistrationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRegistrationDto) {
    try {
      return await this.prisma.courseRegistration.create({
        data: dto,
        include: registrationInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'This student is already registered for this course in this semester',
        );
      }
      throw error;
    }
  }

  findAll(query: QueryRegistrationDto) {
    const { studentId, courseId, semesterId, status } = query;
    return this.prisma.courseRegistration.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(courseId && { courseId }),
        ...(semesterId && { semesterId }),
        ...(status && { status }),
      },
      orderBy: { registeredAt: 'desc' },
      include: registrationInclude,
    });
  }

  async findOne(id: string) {
    const registration = await this.prisma.courseRegistration.findUnique({
      where: { id },
      include: registrationInclude,
    });
    if (!registration) throw new NotFoundException('Registration not found');
    return registration;
  }

  async drop(id: string) {
    await this.findOne(id);
    return this.prisma.courseRegistration.update({
      where: { id },
      data: { status: RegistrationStatus.DROPPED },
      include: registrationInclude,
    });
  }
}
