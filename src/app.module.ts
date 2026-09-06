import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StudentsModule } from './students/students.module.js';
import { HealthModule } from './health/health.module.js';
import * as Joi from 'joi';


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
        }),
      }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    StudentsModule,
    HealthModule,
  ],
})
export class AppModule {}
