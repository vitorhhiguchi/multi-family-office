import type { FastifyInstance } from 'fastify';
import { movementService } from '../services/movement.service.js';
import {
    createMovementSchema,
    updateMovementSchema,
    movementIdParamSchema,
    movementQuerySchema
} from '../schemas/movement.schema.js';

export async function movementRoutes(app: FastifyInstance) {
    // Create movement
    app.post('/', {
        schema: {
            tags: ['Movements'],
            summary: 'Create a new movement (income or expense)',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                    category: { type: 'string', enum: ['WORK', 'PASSIVE', 'OTHER'] },
                    value: { type: 'number' },
                    frequency: { type: 'string', enum: ['ONCE', 'MONTHLY', 'YEARLY'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                    simulationId: { type: 'number' },
                },
                required: ['name', 'type', 'value', 'frequency', 'startDate', 'simulationId'],
            },
        },
        handler: async (request, reply) => {
            const data = createMovementSchema.parse(request.body);
            const movement = await movementService.create(data);
            return reply.status(201).send(movement);
        },
    });

    // List movements
    app.get('/', {
        schema: {
            tags: ['Movements'],
            summary: 'List movements',
            querystring: {
                type: 'object',
                properties: {
                    simulationId: { type: 'string' },
                    type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                },
            },
        },
        handler: async (request) => {
            const query = movementQuerySchema.parse(request.query);
            return movementService.findAll(query.simulationId, query.type);
        },
    });

    // Get movement by ID
    app.get('/:id', {
        schema: {
            tags: ['Movements'],
            summary: 'Get movement by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = movementIdParamSchema.parse(request.params);
            const movement = await movementService.findById(id);

            if (!movement) {
                return reply.status(404).send({ error: 'Movement not found' });
            }

            return movement;
        },
    });

    // Update movement
    app.put('/:id', {
        schema: {
            tags: ['Movements'],
            summary: 'Update movement',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                    category: { type: 'string', enum: ['WORK', 'PASSIVE', 'OTHER'] },
                    value: { type: 'number' },
                    frequency: { type: 'string', enum: ['ONCE', 'MONTHLY', 'YEARLY'] },
                    startDate: { type: 'string', format: 'date' },
                    endDate: { type: 'string', format: 'date' },
                },
            },
        },
        handler: async (request, reply) => {
            const { id } = movementIdParamSchema.parse(request.params);
            const data = updateMovementSchema.parse(request.body);

            try {
                const movement = await movementService.update(id, data);
                return movement;
            } catch {
                return reply.status(404).send({ error: 'Movement not found' });
            }
        },
    });

    // Delete movement
    app.delete('/:id', {
        schema: {
            tags: ['Movements'],
            summary: 'Delete movement',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = movementIdParamSchema.parse(request.params);

            try {
                await movementService.delete(id);
                return reply.status(204).send();
            } catch {
                return reply.status(404).send({ error: 'Movement not found' });
            }
        },
    });
}
