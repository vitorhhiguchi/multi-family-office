import { buildApp } from '../../src/app';
import { FastifyInstance } from 'fastify';
import {
    createTestClient,
    createTestSimulation,
    createTestAsset,
    createTestMovement,
    createTestInsurance,
    cleanDatabase
} from '../helpers';

describe('Projection Routes', () => {
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

    describe('POST /projections', () => {
        it('should generate a projection', async () => {
            const client = await createTestClient();
            const sim = await createTestSimulation(client.id);
            await createTestAsset(sim.id, { initialValue: 500000 });
            await createTestMovement(sim.id, { type: 'INCOME', value: 10000 });
            await createTestMovement(sim.id, { type: 'EXPENSE', value: 5000 });

            const response = await app.inject({
                method: 'POST',
                url: '/projections',
                payload: {
                    simulationId: sim.id,
                    status: 'ALIVE',
                    endYear: 2030,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.simulationId).toBe(sim.id);
            expect(body.projections.length).toBeGreaterThan(0);
        });

        it('should handle DEAD status correctly', async () => {
            const client = await createTestClient();
            const sim = await createTestSimulation(client.id);
            await createTestMovement(sim.id, { type: 'EXPENSE', value: 5000 });

            const responseAlive = await app.inject({
                method: 'POST',
                url: '/projections',
                payload: {
                    simulationId: sim.id,
                    status: 'ALIVE',
                    endYear: 2024,
                },
            });

            const responseDead = await app.inject({
                method: 'POST',
                url: '/projections',
                payload: {
                    simulationId: sim.id,
                    status: 'DEAD',
                    endYear: 2024,
                },
            });

            const bodyAlive = JSON.parse(responseAlive.body);
            const bodyDead = JSON.parse(responseDead.body);

            // DEAD should have half the expenses
            expect(bodyDead.projections[0].totalExpenses).toBe(
                bodyAlive.projections[0].totalExpenses / 2
            );
        });

        it('should return 400 for non-existent simulation', async () => {
            const response = await app.inject({
                method: 'POST',
                url: '/projections',
                payload: {
                    simulationId: 99999,
                    status: 'ALIVE',
                },
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe('POST /projections/compare', () => {
        it('should compare multiple simulations', async () => {
            const client = await createTestClient();
            const sim1 = await createTestSimulation(client.id, { name: 'Sim1' });
            const sim2 = await createTestSimulation(client.id, { name: 'Sim2' });
            await createTestAsset(sim1.id);
            await createTestAsset(sim2.id);

            const response = await app.inject({
                method: 'POST',
                url: '/projections/compare',
                payload: {
                    simulationIds: [sim1.id, sim2.id],
                    status: 'ALIVE',
                    endYear: 2025,
                },
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body).toHaveLength(2);
        });
    });
});
