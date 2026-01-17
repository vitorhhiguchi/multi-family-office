import type { FastifyInstance } from 'fastify';
import { clientService } from '../services/client.service.js';
import {
    createClientSchema,
    updateClientSchema,
    clientIdParamSchema
} from '../schemas/client.schema.js';

export async function clientRoutes(app: FastifyInstance) {
    // Create client
    app.post('/', {
        schema: {
            tags: ['Clients'],
            summary: 'Create a new client',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    birthDate: { type: 'string', format: 'date' },
                },
                required: ['name', 'birthDate'],
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        birthDate: { type: 'string' },
                        createdAt: { type: 'string' },
                        updatedAt: { type: 'string' },
                    },
                },
            },
        },
        handler: async (request, reply) => {
            const data = createClientSchema.parse(request.body);
            const client = await clientService.create(data);
            return reply.status(201).send(client);
        },
    });

    // List all clients
    app.get('/', {
        schema: {
            tags: ['Clients'],
            summary: 'List all clients',
            response: {
                200: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number' },
                            name: { type: 'string' },
                            birthDate: { type: 'string' },
                            createdAt: { type: 'string' },
                            updatedAt: { type: 'string' },
                        },
                    },
                },
            },
        },
        handler: async () => {
            return clientService.findAll();
        },
    });

    // Get client by ID
    app.get('/:id', {
        schema: {
            tags: ['Clients'],
            summary: 'Get client by ID',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = clientIdParamSchema.parse(request.params);
            const client = await clientService.findById(id);

            if (!client) {
                return reply.status(404).send({ error: 'Client not found' });
            }

            return client;
        },
    });

    // Update client
    app.put('/:id', {
        schema: {
            tags: ['Clients'],
            summary: 'Update client',
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
                    birthDate: { type: 'string', format: 'date' },
                },
            },
        },
        handler: async (request, reply) => {
            const { id } = clientIdParamSchema.parse(request.params);
            const data = updateClientSchema.parse(request.body);

            try {
                const client = await clientService.update(id, data);
                return client;
            } catch {
                return reply.status(404).send({ error: 'Client not found' });
            }
        },
    });

    // Delete client
    app.delete('/:id', {
        schema: {
            tags: ['Clients'],
            summary: 'Delete client',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = clientIdParamSchema.parse(request.params);

            try {
                await clientService.delete(id);
                return reply.status(204).send();
            } catch {
                return reply.status(404).send({ error: 'Client not found' });
            }
        },
    });
}
