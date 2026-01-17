import { prisma } from '../lib/prisma.js';
import type { CreateInsuranceInput, UpdateInsuranceInput } from '../schemas/insurance.schema.js';

export class InsuranceService {
    async create(data: CreateInsuranceInput) {
        return prisma.insurance.create({
            data: {
                name: data.name,
                type: data.type,
                startDate: new Date(data.startDate),
                durationMonths: data.durationMonths,
                premium: data.premium,
                insuredValue: data.insuredValue,
                simulationId: data.simulationId,
            },
        });
    }

    async findAll(simulationId?: number) {
        return prisma.insurance.findMany({
            where: simulationId ? { simulationId } : undefined,
            orderBy: { startDate: 'asc' },
        });
    }

    async findById(id: number) {
        return prisma.insurance.findUnique({
            where: { id },
            include: {
                simulation: true,
            },
        });
    }

    async update(id: number, data: UpdateInsuranceInput) {
        return prisma.insurance.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.durationMonths && { durationMonths: data.durationMonths }),
                ...(data.premium !== undefined && { premium: data.premium }),
                ...(data.insuredValue && { insuredValue: data.insuredValue }),
            },
        });
    }

    async delete(id: number) {
        return prisma.insurance.delete({
            where: { id },
        });
    }

    // Check if insurance is active at a given date
    isActiveAtDate(insurance: { startDate: Date; durationMonths: number }, date: Date): boolean {
        const endDate = new Date(insurance.startDate);
        endDate.setMonth(endDate.getMonth() + insurance.durationMonths);
        return date >= insurance.startDate && date <= endDate;
    }
}

export const insuranceService = new InsuranceService();
