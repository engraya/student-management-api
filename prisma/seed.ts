import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash(
    'Admin12345',
    12,
  );

  await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
    },
  });

  await prisma.student.createMany({
    data: [
      {
        studentNumber: 'STU-0001',
        firstName: 'Ahmad',
        lastName: 'Yakubu',
        email: 'ahmadyakubuaya@mail.com',
        dateOfBirth: new Date('2002-01-15'),
        gender: 'MALE',
        department: 'Software Engineering',
        level: 400,
      },
      {
        studentNumber: 'STU-0002',
        firstName: 'Rahma',
        lastName: 'Ladan Galadima',
        email: 'rahmagaladimaladan@mail.com',
        dateOfBirth: new Date('2003-05-20'),
        gender: 'FEMALE',
        department: 'Information Technology',
        level: 300,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Database seeded successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
