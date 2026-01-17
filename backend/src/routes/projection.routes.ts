import type { FastifyInstance } from 'fastify';
import { projectionService } from '../services/projection.service.js';
import { createProjectionSchema } from '../schemas/projection.schema.js';

export async function projectionRoutes(app: FastifyInstance) {
    // Generate projection
    app.post('/', {
        schema: {
            tags: ['Projections'],
            summary: 'Generate wealth projection for a simulation',
            body: {
                type: 'object',
                properties: {
                    simulationId: { type: 'number' },
                    status: { type: 'string', enum: ['ALIVE', 'DEAD', 'INVALID'] },
                    endYear: { type: 'number', default: 2060 },
                },
                required: ['simulationId', 'status'],
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        simulationId: { type: 'number' },
                        simulationName: { type: 'string' },
                        status: { type: 'string' },
                        startYear: { type: 'number' },
                        endYear: { type: 'number' },
                        realRate: { type: 'number' },
                        projections: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    year: { type: 'number' },
                                    financialAssets: { type: 'number' },
                                    realEstateAssets: { type: 'number' },
                                    totalPatrimony: { type: 'number' },
                                    totalPatrimonyWithoutInsurance: { type: 'number' },
                                    totalIncome: { type: 'number' },
                                    totalExpenses: { type: 'number' },
                                    netResult: { type: 'number' },
                                    insuranceValue: { type: 'number' },
                                },
                            },
                        },
                    },
                },
            },
        },
        handler: async (request, reply) => {
            const data = createProjectionSchema.parse(request.body);

            try {
                const projection = await projectionService.generateProjection(data);
                return projection;
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to generate projection'
                });
            }
        },
    });

    // Compare multiple projections
    app.post('/compare', {
        schema: {
            tags: ['Projections'],
            summary: 'Compare projections for multiple simulations',
            body: {
                type: 'object',
                properties: {
                    simulationIds: {
                        type: 'array',
                        items: { type: 'number' },
                    },
                    status: { type: 'string', enum: ['ALIVE', 'DEAD', 'INVALID'] },
                    endYear: { type: 'number', default: 2060 },
                },
                required: ['simulationIds', 'status'],
            },
        },
        handler: async (request, reply) => {
            const { simulationIds, status, endYear } = request.body as {
                simulationIds: number[];
                status: 'ALIVE' | 'DEAD' | 'INVALID';
                endYear?: number;
            };

            try {
                const projections = await projectionService.compareProjections(
                    simulationIds,
                    status,
                    endYear
                );
                return projections;
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to compare projections'
                });
            }
        },
    });
}
