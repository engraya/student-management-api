-- Convert legacy academic IDs to UUIDs before changing the column types.
ALTER TABLE "Student" DROP CONSTRAINT "Student_departmentId_fkey";
ALTER TABLE "Department" DROP CONSTRAINT "Department_facultyId_fkey";
ALTER TABLE "Course" DROP CONSTRAINT "Course_departmentId_fkey";

UPDATE "Student"
SET "departmentId" = CASE "departmentId"
  WHEN 'department-software-engineering' THEN '22222222-2222-4222-8222-222222222221'
  WHEN 'department-information-technology' THEN '22222222-2222-4222-8222-222222222222'
  WHEN 'department-computer-science' THEN '22222222-2222-4222-8222-222222222223'
  WHEN 'department-cybersecurity' THEN '22222222-2222-4222-8222-222222222224'
  WHEN 'department-computer-engineering' THEN '22222222-2222-4222-8222-222222222225'
  WHEN 'department-medicine' THEN '22222222-2222-4222-8222-222222222226'
  ELSE "departmentId"
END;

UPDATE "Course"
SET "departmentId" = CASE "departmentId"
  WHEN 'department-software-engineering' THEN '22222222-2222-4222-8222-222222222221'
  WHEN 'department-information-technology' THEN '22222222-2222-4222-8222-222222222222'
  WHEN 'department-computer-science' THEN '22222222-2222-4222-8222-222222222223'
  WHEN 'department-cybersecurity' THEN '22222222-2222-4222-8222-222222222224'
  WHEN 'department-computer-engineering' THEN '22222222-2222-4222-8222-222222222225'
  WHEN 'department-medicine' THEN '22222222-2222-4222-8222-222222222226'
  ELSE "departmentId"
END;

UPDATE "Department"
SET "facultyId" = '11111111-1111-4111-8111-111111111111'
WHERE "facultyId" = 'faculty-computing';

UPDATE "Department"
SET "id" = CASE "id"
  WHEN 'department-software-engineering' THEN '22222222-2222-4222-8222-222222222221'
  WHEN 'department-information-technology' THEN '22222222-2222-4222-8222-222222222222'
  WHEN 'department-computer-science' THEN '22222222-2222-4222-8222-222222222223'
  WHEN 'department-cybersecurity' THEN '22222222-2222-4222-8222-222222222224'
  WHEN 'department-computer-engineering' THEN '22222222-2222-4222-8222-222222222225'
  WHEN 'department-medicine' THEN '22222222-2222-4222-8222-222222222226'
  ELSE "id"
END;

UPDATE "Faculty"
SET "id" = '11111111-1111-4111-8111-111111111111'
WHERE "id" = 'faculty-computing';

ALTER TABLE "Faculty"
  ALTER COLUMN "id" SET DATA TYPE UUID USING "id"::uuid;
ALTER TABLE "Department"
  ALTER COLUMN "id" SET DATA TYPE UUID USING "id"::uuid,
  ALTER COLUMN "facultyId" SET DATA TYPE UUID USING "facultyId"::uuid;
ALTER TABLE "Student"
  ALTER COLUMN "departmentId" SET DATA TYPE UUID USING "departmentId"::uuid;
ALTER TABLE "Course"
  ALTER COLUMN "departmentId" SET DATA TYPE UUID USING "departmentId"::uuid;

ALTER TABLE "Student"
  ADD CONSTRAINT "Student_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Department"
  ADD CONSTRAINT "Department_facultyId_fkey"
  FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course"
  ADD CONSTRAINT "Course_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;