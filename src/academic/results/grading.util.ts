import { Grade } from '../../generated/prisma/client.js';

export interface GradeResult {
  totalScore: number;
  grade: Grade;
  gradePoint: number;
}

const GRADE_SCALE: { min: number; grade: Grade; gradePoint: number }[] = [
  { min: 70, grade: 'A' as Grade, gradePoint: 5.0 },
  { min: 60, grade: 'B' as Grade, gradePoint: 4.0 },
  { min: 50, grade: 'C' as Grade, gradePoint: 3.0 },
  { min: 45, grade: 'D' as Grade, gradePoint: 2.0 },
  { min: 40, grade: 'E' as Grade, gradePoint: 1.0 },
  { min: 0, grade: 'F' as Grade, gradePoint: 0.0 },
];

export function computeGrade(caScore: number, examScore: number): GradeResult {
  const totalScore = caScore + examScore;
  const band = GRADE_SCALE.find((b) => totalScore >= b.min)!;
  return { totalScore, grade: band.grade, gradePoint: band.gradePoint };
}
