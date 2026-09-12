import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateResultDto } from './dto/create-result.dto.js';
import { UpdateResultDto } from './dto/update-result.dto.js';
import { QueryResultDto } from './dto/query-result.dto.js';
import { computeGrade } from './grading.util.js';

const resultInclude = {
  student: { select: { id: true, studentNumber: true, firstName: true, lastName: true } },
  course: true,
  semester: { include: { session: true } },
} as const;

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateResultDto) {
    const { totalScore, grade, gradePoint } = computeGrade(dto.caScore, dto.examScore);

    try {
      return await this.prisma.result.create({
        data: {
          studentId: dto.studentId,
          courseId: dto.courseId,
          semesterId: dto.semesterId,
          caScore: dto.caScore,
          examScore: dto.examScore,
          totalScore,
          grade,
          gradePoint,
        },
        include: resultInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'A result already exists for this student, course and semester',
        );
      }
      throw error;
    }
  }

  findAll(query: QueryResultDto) {
    const { studentId, courseId, semesterId } = query;
    return this.prisma.result.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(courseId && { courseId }),
        ...(semesterId && { semesterId }),
      },
      orderBy: { createdAt: 'desc' },
      include: resultInclude,
    });
  }

  async findOne(id: string) {
    const result = await this.prisma.result.findUnique({ where: { id }, include: resultInclude });
    if (!result) throw new NotFoundException('Result not found');
    return result;
  }

  async update(id: string, dto: UpdateResultDto) {
    await this.findOne(id);
    const { totalScore, grade, gradePoint } = computeGrade(dto.caScore, dto.examScore);

    return this.prisma.result.update({
      where: { id },
      data: { caScore: dto.caScore, examScore: dto.examScore, totalScore, grade, gradePoint },
      include: resultInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.result.delete({ where: { id } });
    return { message: 'Result deleted successfully' };
  }
}
