import { prisma } from '../lib/prisma.js';
import type {
    CreateAssetInput,
    UpdateAssetInput,
    CreateAssetRecordInput,
    UpdateAssetRecordInput
} from '../schemas/asset.schema.js';

export class AssetService {
    async create(data: CreateAssetInput) {
        return prisma.$transaction(async (tx) => {
            const asset = await tx.asset.create({
                data: {
                    name: data.name,
                    type: data.type,
                    simulationId: data.simulationId,
                },
            });

            // Create initial record
            await tx.assetRecord.create({
                data: {
                    assetId: asset.id,
                    value: data.initialValue,
                    date: new Date(data.initialDate),
                },
            });

            // Create financing if provided
            if (data.financing) {
                await tx.financing.create({
                    data: {
                        assetId: asset.id,
                        startDate: new Date(data.financing.startDate),
                        installments: data.financing.installments,
                        interestRate: data.financing.interestRate,
                        downPayment: data.financing.downPayment,
                    },
                });
            }

            return tx.asset.findUnique({
                where: { id: asset.id },
                include: {
                    records: true,
                    financing: true,
                },
            });
        });
    }

    async findAll(simulationId?: number) {
        return prisma.asset.findMany({
            where: simulationId ? { simulationId } : undefined,
            include: {
                records: {
                    orderBy: { date: 'desc' },
                },
                financing: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number) {
        return prisma.asset.findUnique({
            where: { id },
            include: {
                records: {
                    orderBy: { date: 'desc' },
                },
                financing: true,
                simulation: true,
            },
        });
    }

    async update(id: number, data: UpdateAssetInput) {
        return prisma.asset.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
            },
            include: {
                records: true,
                financing: true,
            },
        });
    }

    async delete(id: number) {
        return prisma.asset.delete({
            where: { id },
        });
    }

    async addRecord(assetId: number, data: CreateAssetRecordInput) {
        return prisma.assetRecord.create({
            data: {
                assetId,
                value: data.value,
                date: new Date(data.date),
            },
        });
    }

    async updateRecord(recordId: number, data: UpdateAssetRecordInput) {
        return prisma.assetRecord.update({
            where: { id: recordId },
            data: {
                ...(data.value !== undefined && { value: data.value }),
                ...(data.date && { date: new Date(data.date) }),
            },
        });
    }

    async getRecords(assetId: number) {
        return prisma.assetRecord.findMany({
            where: { assetId },
            orderBy: { date: 'desc' },
        });
    }

    // Get the most recent record before a given date
    async getRecordAtDate(assetId: number, date: Date) {
        return prisma.assetRecord.findFirst({
            where: {
                assetId,
                date: {
                    lte: date,
                },
            },
            orderBy: { date: 'desc' },
        });
    }

    // Quick update: create new record with current date
    async quickUpdate(assetId: number, value: number) {
        return prisma.assetRecord.create({
            data: {
                assetId,
                value,
                date: new Date(),
            },
        });
    }
}

export const assetService = new AssetService();
