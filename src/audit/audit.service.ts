import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface LogInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

interface QueryAuditDto {
  userId?: string;
  action?: string;
  entity?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput) {
    await this.prisma.auditLog.create({
      data: {
        ...input,
        userId: input.userId ?? null,
      },
    });
  }

  async record(input: LogInput) {
    return this.log(input);
  }

  async findAll(query: QueryAuditDto) {
    const { userId, action, entity, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entity && { entity }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}
