import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import { createTestClient, cleanDatabase } from '../helpers';

describe('Client Routes', () => {
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

    describe('POST /clients', () => {
        it('should create a new client', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/clients',
                payload: {
                    name: 'John Doe',
                    birthDate: '1980-01-15',
                },
            });

            expect(response.statusCode).toBe(201);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('John Doe');
            expect(body.id).toBeDefined();
        });

        it('should return 400 for invalid data', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/clients',
                payload: {
                    name: '',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('GET /clients', () => {
        it('should return all clients', async () => {
            await createTestClient({ name: 'Client 1' });
            await createTestClient({ name: 'Client 2' });

            const response = await app.inject({
                method: 'GET',
                url: '/clients',
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveLength(2);
        });
    });

    describe('GET /clients/:id', () => {
        it('should return a client by id', async () => {
            const client = await createTestClient({ name: 'Test Client' });

            const response = await app.inject({
                method: 'GET',
                url: `/clients/${client.id}`,
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('Test Client');
        });

        it('should return 404 for non-existent client', async () => {
            const response = await app.inject({
                method: 'GET',
                url: '/clients/99999',
            });

            expect(response.statusCode).toBe(404);
        });
    });

    describe('PUT /clients/:id', () => {
        it('should update a client', async () => {
            const client = await createTestClient({ name: 'Old Name' });

            const response = await app.inject({
                method: 'PUT',
                url: `/clients/${client.id}`,
                payload: {
                    name: 'New Name',
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.name).toBe('New Name');
        });
    });

    describe('DELETE /clients/:id', () => {
        it('should delete a client', async () => {
            const client = await createTestClient();

            const response = await app.inject({
                method: 'DELETE',
                url: `/clients/${client.id}`,
            });

            expect(response.statusCode).toBe(204);

            const getResponse = await app.inject({
                method: 'GET',
                url: `/clients/${client.id}`,
            });

            expect(getResponse.statusCode).toBe(404);
        });
    });
});
