import request from 'supertest';
import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';

describe('Health Check (e2e)', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Constrói app sem Prisma para teste isolado do health check
        app = await buildApp({ skipPrisma: true, disableLogger: true });
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /health', () => {
        it('should return 200 with health status', async () => {
            const response = await request(app.server)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
            expect(typeof response.body.uptime).toBe('number');
        });

        it('should return valid ISO timestamp', async () => {
            const response = await request(app.server)
                .get('/health')
                .expect(200);

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toISOString()).toBe(response.body.timestamp);
        });
    });
});
