import { prisma } from '../src/lib/prisma';
import type { Client, Simulation, Asset, Movement, Insurance } from '@prisma/client';

export async function createTestClient(data?: Partial<Client>): Promise<Client> {
    return prisma.client.create({
        data: {
            name: data?.name ?? 'Test Client',
            birthDate: data?.birthDate ?? new Date('1980-01-01'),
        },
    });
}

export async function createTestSimulation(
    clientId: number,
    data?: Partial<Simulation>
): Promise<Simulation> {
    return prisma.simulation.create({
        data: {
            name: data?.name ?? 'Test Simulation',
            startDate: data?.startDate ?? new Date('2024-01-01'),
            realRate: data?.realRate ?? 0.04,
            clientId,
            version: data?.version ?? 1,
        },
    });
}

export async function createTestAsset(
    simulationId: number,
    data?: Partial<Asset> & { initialValue?: number; initialDate?: Date }
) {
    const asset = await prisma.asset.create({
        data: {
            name: data?.name ?? 'Test Asset',
            type: data?.type ?? 'FINANCIAL',
            simulationId,
        },
    });

    await prisma.assetRecord.create({
        data: {
            assetId: asset.id,
            value: data?.initialValue ?? 100000,
            date: data?.initialDate ?? new Date('2024-01-01'),
        },
    });

    return prisma.asset.findUnique({
        where: { id: asset.id },
        include: { records: true, financing: true },
    });
}

export async function createTestMovement(
    simulationId: number,
    data?: Partial<Movement>
): Promise<Movement> {
    return prisma.movement.create({
        data: {
            name: data?.name ?? 'Test Movement',
            type: data?.type ?? 'INCOME',
            category: data?.category ?? 'WORK',
            value: data?.value ?? 10000,
            frequency: data?.frequency ?? 'MONTHLY',
            startDate: data?.startDate ?? new Date('2024-01-01'),
            endDate: data?.endDate ?? null,
            simulationId,
        },
    });
}

export async function createTestInsurance(
    simulationId: number,
    data?: Partial<Insurance>
): Promise<Insurance> {
    return prisma.insurance.create({
        data: {
            name: data?.name ?? 'Test Insurance',
            type: data?.type ?? 'LIFE',
            startDate: data?.startDate ?? new Date('2024-01-01'),
            durationMonths: data?.durationMonths ?? 120,
            premium: data?.premium ?? 500,
            insuredValue: data?.insuredValue ?? 1000000,
            simulationId,
        },
    });
}

export async function cleanDatabase() {
    await prisma.$executeRaw`TRUNCATE TABLE "Insurance" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Movement" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "AssetRecord" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Financing" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Asset" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Simulation" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE`;
}
