import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AuditModule } from './audit/audit.module.js';
import { MailModule } from './common/mail/mail.module.js';
import { StudentsModule } from './students/students.module.js';
import { HealthModule } from './health/health.module.js';
import { FacultiesModule } from './academic/faculties/faculties.module.js';
import { DepartmentsModule } from './academic/departments/departments.module.js';
import { CoursesModule } from './academic/courses/courses.module.js';
import { SessionsModule } from './academic/sessions/sessions.module.js';
import { SemestersModule } from './academic/semesters/semesters.module.js';
import { RegistrationsModule } from './academic/registrations/registrations.module.js';
import { ResultsModule } from './academic/results/results.module.js';
import { GpaModule } from './academic/gpa/gpa.module.js';
import { AttendanceModule } from './academic/attendance/attendance.module.js';
import Joi from 'joi';


@Module({
  imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        cache: true,

        validationSchema: Joi.object({
          NODE_ENV: Joi.string()
            .valid('development', 'test', 'production')
            .default('development'),

          PORT: Joi.number()
            .port()
            .default(3000),

          DATABASE_URL: Joi.string()
            .uri()
            .required(),

          JWT_SECRET: Joi.string()
            .min(32)
            .required(),

          JWT_EXPIRES_IN: Joi.string()
            .default('15m'),

          CORS_ORIGIN: Joi.string()
            .required(),

          SMTP_HOST: Joi.string()
            .required(),

          SMTP_PORT: Joi.number()
            .port()
            .default(587),

          SMTP_USER: Joi.string()
            .required(),

          SMTP_PASSWORD: Joi.string()
            .required(),

          EMAIL_FROM: Joi.string()
            .email()
            .required(),

          FRONTEND_URL: Joi.string()
            .uri()
            .required(),
        }),
      }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    MailModule,
    AuthModule,
    StudentsModule,
    HealthModule,
    UsersModule,
    AuditModule,
    FacultiesModule,
    DepartmentsModule,
    CoursesModule,
    SessionsModule,
    SemestersModule,
    RegistrationsModule,
    ResultsModule,
    GpaModule,
    AttendanceModule,
  ],
})
export class AppModule {}
