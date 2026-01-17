import type { FastifyInstance } from 'fastify';
import { assetService } from '../services/asset.service.js';
import {
    createAssetSchema,
    updateAssetSchema,
    assetIdParamSchema,
    assetQuerySchema,
    createAssetRecordSchema,
    updateAssetRecordSchema,
    recordIdParamSchema
} from '../schemas/asset.schema.js';

export async function assetRoutes(app: FastifyInstance) {
    // Create asset
    app.post('/', {
        schema: {
            tags: ['Assets'],
            summary: 'Create a new asset with initial value',
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['FINANCIAL', 'REAL_ESTATE'] },
                    simulationId: { type: 'number' },
                    initialValue: { type: 'number' },
                    initialDate: { type: 'string', format: 'date' },
                    financing: {
                        type: 'object',
                        properties: {
                            startDate: { type: 'string', format: 'date' },
                            installments: { type: 'number' },
                            interestRate: { type: 'number' },
                            downPayment: { type: 'number' },
                        },
                    },
                },
                required: ['name', 'type', 'simulationId', 'initialValue', 'initialDate'],
            },
        },
        handler: async (request, reply) => {
            const data = createAssetSchema.parse(request.body);
            const asset = await assetService.create(data);
            return reply.status(201).send(asset);
        },
    });

    // List assets
    app.get('/', {
        schema: {
            tags: ['Assets'],
            summary: 'List assets',
            querystring: {
                type: 'object',
                properties: {
                    simulationId: { type: 'string' },
                },
            },
        },
        handler: async (request) => {
            const query = assetQuerySchema.parse(request.query);
            return assetService.findAll(query.simulationId);
        },
    });

    // Get asset by ID
    app.get('/:id', {
        schema: {
            tags: ['Assets'],
            summary: 'Get asset by ID with all records',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = assetIdParamSchema.parse(request.params);
            const asset = await assetService.findById(id);

            if (!asset) {
                return reply.status(404).send({ error: 'Asset not found' });
            }

            return asset;
        },
    });

    // Update asset
    app.put('/:id', {
        schema: {
            tags: ['Assets'],
            summary: 'Update asset name',
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
                },
            },
        },
        handler: async (request, reply) => {
            const { id } = assetIdParamSchema.parse(request.params);
            const data = updateAssetSchema.parse(request.body);

            try {
                const asset = await assetService.update(id, data);
                return asset;
            } catch {
                return reply.status(404).send({ error: 'Asset not found' });
            }
        },
    });

    // Delete asset
    app.delete('/:id', {
        schema: {
            tags: ['Assets'],
            summary: 'Delete asset',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request, reply) => {
            const { id } = assetIdParamSchema.parse(request.params);

            try {
                await assetService.delete(id);
                return reply.status(204).send();
            } catch {
                return reply.status(404).send({ error: 'Asset not found' });
            }
        },
    });

    // Add new record to asset
    app.post('/:id/records', {
        schema: {
            tags: ['Assets'],
            summary: 'Add a new record to an asset',
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
                    value: { type: 'number' },
                    date: { type: 'string', format: 'date' },
                },
                required: ['value', 'date'],
            },
        },
        handler: async (request, reply) => {
            const { id } = assetIdParamSchema.parse(request.params);
            const data = createAssetRecordSchema.parse(request.body);

            const record = await assetService.addRecord(id, data);
            return reply.status(201).send(record);
        },
    });

    // Get asset records
    app.get('/:id/records', {
        schema: {
            tags: ['Assets'],
            summary: 'Get all records for an asset',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                },
                required: ['id'],
            },
        },
        handler: async (request) => {
            const { id } = assetIdParamSchema.parse(request.params);
            return assetService.getRecords(id);
        },
    });

    // Update asset record
    app.put('/:id/records/:recordId', {
        schema: {
            tags: ['Assets'],
            summary: 'Update a specific record',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    recordId: { type: 'string' },
                },
                required: ['id', 'recordId'],
            },
            body: {
                type: 'object',
                properties: {
                    value: { type: 'number' },
                    date: { type: 'string', format: 'date' },
                },
            },
        },
        handler: async (request, reply) => {
            const { recordId } = recordIdParamSchema.parse(request.params);
            const data = updateAssetRecordSchema.parse(request.body);

            try {
                const record = await assetService.updateRecord(recordId, data);
                return record;
            } catch {
                return reply.status(404).send({ error: 'Record not found' });
            }
        },
    });

    // Quick update (add record with current date)
    app.post('/:id/quick-update', {
        schema: {
            tags: ['Assets'],
            summary: 'Add a record with current date (quick update button)',
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
                    value: { type: 'number' },
                },
                required: ['value'],
            },
        },
        handler: async (request, reply) => {
            const { id } = assetIdParamSchema.parse(request.params);
            const { value } = request.body as { value: number };

            const record = await assetService.quickUpdate(id, value);
            return reply.status(201).send(record);
        },
    });
}
