import { prisma } from '../lib/prisma.js';
import type { CreateClientInput, UpdateClientInput } from '../schemas/client.schema.js';

export class ClientService {
    async create(data: CreateClientInput) {
        return prisma.client.create({
            data: {
                name: data.name,
                birthDate: new Date(data.birthDate),
            },
        });
    }

    async findAll() {
        return prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number) {
        return prisma.client.findUnique({
            where: { id },
            include: {
                simulations: {
                    orderBy: { version: 'desc' },
                },
            },
        });
    }

    async update(id: number, data: UpdateClientInput) {
        return prisma.client.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
            },
        });
    }

    async delete(id: number) {
        return prisma.client.delete({
            where: { id },
        });
    }
}

export const clientService = new ClientService();
