import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

interface WeightedResult {
  gradePoint: number;
  creditUnits: number;
}

function weightedAverage(results: WeightedResult[]) {
  const totalUnits = results.reduce((sum, r) => sum + r.creditUnits, 0);
  if (totalUnits === 0) return { gpa: 0, totalCreditUnits: 0 };

  const weightedSum = results.reduce((sum, r) => sum + r.gradePoint * r.creditUnits, 0);
  return {
    gpa: Number((weightedSum / totalUnits).toFixed(2)),
    totalCreditUnits: totalUnits,
  };
}

@Injectable()
export class GpaService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertStudentExists(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
  }

  async getSemesterGpa(studentId: string, semesterId: string) {
    await this.assertStudentExists(studentId);

    const results = await this.prisma.result.findMany({
      where: { studentId, semesterId },
      include: { course: { select: { creditUnits: true, code: true, title: true } } },
    });

    const { gpa, totalCreditUnits } = weightedAverage(
      results.map((r) => ({ gradePoint: r.gradePoint, creditUnits: r.course.creditUnits })),
    );

    return {
      studentId,
      semesterId,
      gpa,
      totalCreditUnits,
      courses: results.map((r) => ({
        courseCode: r.course.code,
        courseTitle: r.course.title,
        creditUnits: r.course.creditUnits,
        grade: r.grade,
        gradePoint: r.gradePoint,
      })),
    };
  }

  async getCgpa(studentId: string) {
    await this.assertStudentExists(studentId);

    const results = await this.prisma.result.findMany({
      where: { studentId },
      include: {
        course: { select: { creditUnits: true } },
        semester: { include: { session: true } },
      },
    });

    const { gpa: cgpa, totalCreditUnits } = weightedAverage(
      results.map((r) => ({ gradePoint: r.gradePoint, creditUnits: r.course.creditUnits })),
    );

    // Also break it down per-semester so a transcript view has both
    // the cumulative figure and the semester-by-semester progression.
    const bySemester = new Map<string, { label: string; results: WeightedResult[] }>();
    for (const r of results) {
      const key = r.semesterId;
      const label = `${r.semester.session.name} — ${r.semester.name}`;
      if (!bySemester.has(key)) bySemester.set(key, { label, results: [] });
      bySemester.get(key)!.results.push({ gradePoint: r.gradePoint, creditUnits: r.course.creditUnits });
    }

    const semesterBreakdown = Array.from(bySemester.entries()).map(([semesterId, { label, results }]) => ({
      semesterId,
      label,
      ...weightedAverage(results),
    }));

    return { studentId, cgpa, totalCreditUnits, semesterBreakdown };
  }
}
