import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import {
    createTestClient,
    createTestSimulation,
    createTestAsset,
    createTestMovement,
    cleanDatabase
} from '../helpers';

describe('Simulation Routes', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await buildApp();
        await app.ready();
    });

    beforeEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /simulations', () => {
        it('should create a new simulation', async () => {
            const client = await createTestClient();

            const response = await app.inject({
                method: 'POST',
                url: '/simulations',
                payload: {
                    name: 'Plano Original',
                    startDate: '2024-01-01',
                    realRate: 0.04,
                    clientId: client.id,
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('Plano Original');
            expect(body.realRate).toBe(0.04);
        });

        it('should not allow duplicate names for same client', async () => {
            const client = await createTestClient();
            await createTestSimulation(client.id, { name: 'Plano Original' });

            const response = await app.inject({
                method: 'POST',
                url: '/simulations',
                payload: {
                    name: 'Plano Original',
                    startDate: '2024-01-01',
                    clientId: client.id,
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /simulations', () => {
        it('should return only latest versions by default', async () => {
            const client = await createTestClient();
            await createTestSimulation(client.id, { name: 'Sim1', version: 1 });
            await createTestSimulation(client.id, { name: 'Sim1', version: 2 });
            await createTestSimulation(client.id, { name: 'Sim2', version: 1 });

            const response = await app.inject({
                method: 'GET',
                url: `/simulations?clientId=${client.id}`,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveLength(2);
        });

        it('should return all versions when requested', async () => {
            const client = await createTestClient();
            await createTestSimulation(client.id, { name: 'Sim1', version: 1 });
            await createTestSimulation(client.id, { name: 'Sim1', version: 2 });

            const response = await app.inject({
                method: 'GET',
                url: `/simulations?clientId=${client.id}&includeAllVersions=true`,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveLength(2);
        });
    });

    describe('POST /simulations/:id/version', () => {
        it('should create a new version', async () => {
            const client = await createTestClient();
            const sim = await createTestSimulation(client.id, { name: 'Plano', version: 1 });
            await createTestAsset(sim.id);
            await createTestMovement(sim.id);

            const response = await app.inject({
                method: 'POST',
                url: `/simulations/${sim.id}/version`,
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('Plano');
            expect(body.version).toBe(2);
        });
    });

    describe('POST /simulations/:id/duplicate', () => {
        it('should duplicate with new name', async () => {
            const client = await createTestClient();
            const sim = await createTestSimulation(client.id, { name: 'Original' });

            const response = await app.inject({
                method: 'POST',
                url: `/simulations/${sim.id}/duplicate`,
                payload: {
                    name: 'Novo Plano',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('Novo Plano');
            expect(body.version).toBe(1);
        });

        it('should not allow duplicate to existing name', async () => {
            const client = await createTestClient();
            await createTestSimulation(client.id, { name: 'Existing' });
            const sim = await createTestSimulation(client.id, { name: 'Original' });

            const response = await app.inject({
                method: 'POST',
                url: `/simulations/${sim.id}/duplicate`,
                payload: {
                    name: 'Existing',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });
});
