import type { FastifyInstance } from 'fastify';
import { simulationService } from '../services/simulation.service.js';
import {
    createSimulationSchema,
    updateSimulationSchema,
    simulationIdParamSchema,
    simulationQuerySchema,
    duplicateSimulationSchema
} from '../schemas/simulation.schema.js';

export async function simulationRoutes(app: FastifyInstance) {
    // Create simulation
    app.post('/', {
        schema: {
            tags: ['Simulations'],
            summary: 'Create a new simulation',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    startDate: { type: 'string', format: 'date' },
                    realRate: { type: 'number', default: 0.04 },
                    clientId: { type: 'number' },
                },
                required: ['name', 'startDate', 'clientId'],
            },
        },
        handler: async (request, reply) => {
            const data = createSimulationSchema.parse(request.body);
            try {
                const simulation = await simulationService.create(data);
                return reply.status(201).send(simulation);
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to create simulation'
                });
            }
        },
    });

    // List simulations
    app.get('/', {
        schema: {
            tags: ['Simulations'],
            summary: 'List simulations',
            querystring: {
                type: 'object',
                properties: {
                    clientId: { type: 'string' },
                    includeAllVersions: { type: 'string' },
                },
            },
        },
        handler: async (request) => {
            const query = simulationQuerySchema.parse(request.query);
            return simulationService.findAll(query.clientId, query.includeAllVersions);
        },
    });

    // Get simulation by ID
    app.get('/:id', {
        schema: {
            tags: ['Simulations'],
            summary: 'Get simulation by ID with all related data',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = simulationIdParamSchema.parse(request.params);
            const simulation = await simulationService.findById(id);

            if (!simulation) {
                return reply.status(404).send({ error: 'Simulation not found' });
            }

            return simulation;
        },
    });

    // Update simulation
    app.put('/:id', {
        schema: {
            tags: ['Simulations'],
            summary: 'Update simulation (name, startDate, realRate)',
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
                    startDate: { type: 'string', format: 'date' },
                    realRate: { type: 'number' },
                },
            },
        },
        handler: async (request, reply) => {
            const { id } = simulationIdParamSchema.parse(request.params);
            const data = updateSimulationSchema.parse(request.body);

            try {
                const simulation = await simulationService.update(id, data);
                return simulation;
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to update simulation'
                });
            }
        },
    });

    // Delete simulation
    app.delete('/:id', {
        schema: {
            tags: ['Simulations'],
            summary: 'Delete simulation',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = simulationIdParamSchema.parse(request.params);

            try {
                await simulationService.delete(id);
                return reply.status(204).send();
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to delete simulation'
                });
            }
        },
    });

    // Create new version
    app.post('/:id/version', {
        schema: {
            tags: ['Simulations'],
            summary: 'Create a new version of the simulation (same name, incremented version)',
        },
        handler: async (request, reply) => {
            const { id } = simulationIdParamSchema.parse(request.params);

            try {
                const simulation = await simulationService.createVersion(id);
                return reply.status(201).send(simulation);
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to create version'
                });
            }
        },
    });

    // Duplicate simulation with new name
    app.post('/:id/duplicate', {
        schema: {
            tags: ['Simulations'],
            summary: 'Duplicate simulation with a new name',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                },
                required: ['name'],
            },
        },
        handler: async (request, reply) => {
            const { id } = simulationIdParamSchema.parse(request.params);
            const data = duplicateSimulationSchema.parse(request.body);

            try {
                const simulation = await simulationService.duplicate(id, data);
                return reply.status(201).send(simulation);
            } catch (error) {
                return reply.status(400).send({
                    error: error instanceof Error ? error.message : 'Failed to duplicate simulation'
                });
            }
        },
    });
}
