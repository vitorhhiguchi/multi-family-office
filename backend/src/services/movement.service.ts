import { prisma } from '../lib/prisma.js';
import type { MovementType } from '@prisma/client';
import type { CreateMovementInput, UpdateMovementInput } from '../schemas/movement.schema.js';

export class MovementService {
    async create(data: CreateMovementInput) {
        return prisma.movement.create({
            data: {
                name: data.name,
                type: data.type,
                category: data.category,
                value: data.value,
                frequency: data.frequency,
                startDate: new Date(data.startDate),
                endDate: data.endDate ? new Date(data.endDate) : null,
                simulationId: data.simulationId,
            },
        });
    }

    async findAll(simulationId?: number, type?: MovementType) {
        return prisma.movement.findMany({
            where: {
                ...(simulationId && { simulationId }),
                ...(type && { type }),
            },
            orderBy: { startDate: 'asc' },
        });
    }

    async findById(id: number) {
        return prisma.movement.findUnique({
            where: { id },
            include: {
                simulation: true,
            },
        });
    }

    async update(id: number, data: UpdateMovementInput) {
        return prisma.movement.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.type && { type: data.type }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.value && { value: data.value }),
                ...(data.frequency && { frequency: data.frequency }),
                ...(data.startDate && { startDate: new Date(data.startDate) }),
                ...(data.endDate !== undefined && {
                    endDate: data.endDate ? new Date(data.endDate) : null
                }),
            },
        });
    }

    async delete(id: number) {
        return prisma.movement.delete({
            where: { id },
        });
    }
}

export const movementService = new MovementService();
