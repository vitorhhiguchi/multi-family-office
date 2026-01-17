import { prisma } from '../src/lib/prisma';

beforeAll(async () => {
    // Clean database before tests
    await prisma.$executeRaw`TRUNCATE TABLE "Insurance" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Movement" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "AssetRecord" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Financing" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Asset" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Simulation" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE`;
});

afterAll(async () => {
    await prisma.$disconnect();
});
