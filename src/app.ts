import Fastify, { FastifyInstance } from 'fastify';
import { swaggerPlugin } from './plugins/swagger';
import { prismaPlugin } from './plugins/prisma';
import { healthRoutes } from './routes/health.route';

export interface AppOptions {
    /**
     * Se true, pula registro do plugin Prisma (útil para testes do health check)
     */
    skipPrisma?: boolean;
    /**
     * Se true, desabilita o logger
     */
    disableLogger?: boolean;
}

/**
 * Constrói e configura a instância do Fastify
 */
export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
    const app = Fastify({
        logger: options.disableLogger
            ? false
            : {
                level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                transport:
                    process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                translateTime: 'HH:MM:ss Z',
                                ignore: 'pid,hostname',
                            },
                        }
                        : undefined,
            },
    });

    // Registra plugins
    await app.register(swaggerPlugin);

    if (!options.skipPrisma) {
        await app.register(prismaPlugin);
    }

    // Registra rotas
    await app.register(healthRoutes);

    return app;
}
