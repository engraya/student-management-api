import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import { QueryAttendanceDto } from './dto/query-attendance.dto.js';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async mark(dto: MarkAttendanceDto, recordedById: string) {
    const date = new Date(dto.date);

    const result = await this.prisma.attendance.createMany({
      data: dto.entries.map((entry) => ({
        studentId: entry.studentId,
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        date,
        status: entry.status,
        recordedById,
      })),
      skipDuplicates: true,
    });

    return {
      message: `Attendance recorded for ${result.count} of ${dto.entries.length} students`,
      recorded: result.count,
      submitted: dto.entries.length,
    };
  }

  findAll(query: QueryAttendanceDto) {
    const { studentId, courseId, semesterId, date } = query;
    return this.prisma.attendance.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(courseId && { courseId }),
        ...(semesterId && { semesterId }),
        ...(date && { date: new Date(date) }),
      },
      orderBy: { date: 'desc' },
      include: {
        student: { select: { id: true, studentNumber: true, firstName: true, lastName: true } },
        course: { select: { code: true, title: true } },
      },
    });
  }

  async getStudentSummary(studentId: string, courseId?: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const records = await this.prisma.attendance.findMany({
      where: { studentId, ...(courseId && { courseId }) },
      include: { course: { select: { id: true, code: true, title: true } } },
    });

    const byCourse = new Map<string, { code: string; title: string; total: number; present: number }>();
    for (const record of records) {
      const key = record.courseId;
      if (!byCourse.has(key)) {
        byCourse.set(key, {
          code: record.course.code,
          title: record.course.title,
          total: 0,
          present: 0,
        });
      }
      const entry = byCourse.get(key)!;
      entry.total += 1;
      if (record.status === 'PRESENT') entry.present += 1;
    }

    return {
      studentId,
      courses: Array.from(byCourse.values()).map((c) => ({
        ...c,
        attendancePercentage: c.total === 0 ? 0 : Number(((c.present / c.total) * 100).toFixed(1)),
      })),
    };
  }
}
