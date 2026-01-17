import type { FastifyInstance } from 'fastify';
import { insuranceService } from '../services/insurance.service.js';
import {
    createInsuranceSchema,
    updateInsuranceSchema,
    insuranceIdParamSchema,
    insuranceQuerySchema
} from '../schemas/insurance.schema.js';

export async function insuranceRoutes(app: FastifyInstance) {
    // Create insurance
    app.post('/', {
        schema: {
            tags: ['Insurances'],
            summary: 'Create a new insurance',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['LIFE', 'DISABILITY'] },
                    startDate: { type: 'string', format: 'date' },
                    durationMonths: { type: 'number' },
                    premium: { type: 'number' },
                    insuredValue: { type: 'number' },
                    simulationId: { type: 'number' },
                },
                required: ['name', 'type', 'startDate', 'durationMonths', 'premium', 'insuredValue', 'simulationId'],
            },
        },
        handler: async (request, reply) => {
            const data = createInsuranceSchema.parse(request.body);
            const insurance = await insuranceService.create(data);
            return reply.status(201).send(insurance);
        },
    });

    // List insurances
    app.get('/', {
        schema: {
            tags: ['Insurances'],
            summary: 'List insurances',
            querystring: {
                type: 'object',
                properties: {
                    simulationId: { type: 'string' },
                },
            },
        },
        handler: async (request) => {
            const query = insuranceQuerySchema.parse(request.query);
            return insuranceService.findAll(query.simulationId);
        },
    });

    // Get insurance by ID
    app.get('/:id', {
        schema: {
            tags: ['Insurances'],
            summary: 'Get insurance by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = insuranceIdParamSchema.parse(request.params);
            const insurance = await insuranceService.findById(id);

            if (!insurance) {
                return reply.status(404).send({ error: 'Insurance not found' });
            }

            return insurance;
        },
    });

    // Update insurance
    app.put('/:id', {
        schema: {
            tags: ['Insurances'],
            summary: 'Update insurance',
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
                    type: { type: 'string', enum: ['LIFE', 'DISABILITY'] },
                    startDate: { type: 'string', format: 'date' },
                    durationMonths: { type: 'number' },
                    premium: { type: 'number' },
                    insuredValue: { type: 'number' },
                },
            },
        },
        handler: async (request, reply) => {
            const { id } = insuranceIdParamSchema.parse(request.params);
            const data = updateInsuranceSchema.parse(request.body);

            try {
                const insurance = await insuranceService.update(id, data);
                return insurance;
            } catch {
                return reply.status(404).send({ error: 'Insurance not found' });
            }
        },
    });

    // Delete insurance
    app.delete('/:id', {
        schema: {
            tags: ['Insurances'],
            summary: 'Delete insurance',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = insuranceIdParamSchema.parse(request.params);

            try {
                await insuranceService.delete(id);
                return reply.status(204).send();
            } catch {
                return reply.status(404).send({ error: 'Insurance not found' });
            }
        },
    });
}
