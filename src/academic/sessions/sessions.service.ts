import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { UpdateSessionDto } from './dto/update-session.dto.js';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSessionDto) {
    try {
      return await this.prisma.session.create({
        data: {
          name: dto.name,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Session name already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.session.findMany({
      orderBy: { startDate: 'desc' },
      include: { semesters: true },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { semesters: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async update(id: string, dto: UpdateSessionDto) {
    await this.findOne(id);
    return this.prisma.session.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
      },
    });
  }

  async setCurrent(id: string) {
    await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.session.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
      return tx.session.update({ where: { id }, data: { isCurrent: true } });
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.session.delete({ where: { id } });
    return { message: 'Session deleted successfully' };
  }
}
