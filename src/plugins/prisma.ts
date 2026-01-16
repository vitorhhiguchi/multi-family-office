import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Plugin que disponibiliza o Prisma Client para toda a aplicação
 */
export async function prismaPlugin(fastify: FastifyInstance) {
    // Decora o fastify com a instância do Prisma
    fastify.decorate('prisma', prisma);

    // Fecha a conexão quando o servidor é encerrado
    fastify.addHook('onClose', async () => {
        await prisma.$disconnect();
    });
}

// Extende os tipos do Fastify para incluir o Prisma
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}
