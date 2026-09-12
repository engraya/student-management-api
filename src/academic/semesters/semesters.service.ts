import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSemesterDto } from './dto/create-semester.dto.js';
import { UpdateSemesterDto } from './dto/update-semester.dto.js';

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSemesterDto) {
    try {
      return await this.prisma.semester.create({
        data: {
          name: dto.name,
          sessionId: dto.sessionId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
        include: { session: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This semester already exists for the given session');
      }
      throw error;
    }
  }

  findAll(sessionId?: string) {
    return this.prisma.semester.findMany({
      where: { ...(sessionId && { sessionId }) },
      orderBy: [{ startDate: 'desc' }],
      include: { session: true },
    });
  }

  async findOne(id: string) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: { session: true },
    });
    if (!semester) throw new NotFoundException('Semester not found');
    return semester;
  }

  async findCurrent() {
    const semester = await this.prisma.semester.findFirst({
      where: { isCurrent: true },
      include: { session: true },
    });
    if (!semester) throw new NotFoundException('No semester is currently marked active');
    return semester;
  }

  async update(id: string, dto: UpdateSemesterDto) {
    await this.findOne(id);
    return this.prisma.semester.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
      include: { session: true },
    });
  }

  async setCurrent(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      return tx.semester.update({ where: { id }, data: { isCurrent: true }, include: { session: true } });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.semester.delete({ where: { id } });
    return { message: 'Semester deleted successfully' };
  }
}
