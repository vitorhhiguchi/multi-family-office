import { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Schema de resposta do health check
 */
const healthResponseSchema = z.object({
    status: z.enum(['ok', 'error']),
    timestamp: z.string(),
    uptime: z.number(),
});

/**
 * Rotas de health check
 */
export async function healthRoutes(fastify: FastifyInstance) {
    fastify.get(
        '/health',
        {
            schema: {
                tags: ['Health'],
                summary: 'Health check endpoint',
                description: 'Verifica se o servidor está funcionando corretamente',
                response: {
                    200: {
                        description: 'Servidor está saudável',
                        type: 'object',
                        properties: {
                            status: { type: 'string', enum: ['ok'] },
                            timestamp: { type: 'string', format: 'date-time' },
                            uptime: { type: 'number', description: 'Uptime em segundos' },
                        },
                    },
                },
            },
        },
        async (_request, reply) => {
            const response = healthResponseSchema.parse({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });

            return reply.send(response);
        }
    );
}
