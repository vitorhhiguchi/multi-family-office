import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { clientRoutes } from './routes/client.routes.js';
import { simulationRoutes } from './routes/simulation.routes.js';
import { assetRoutes } from './routes/asset.routes.js';
import { movementRoutes } from './routes/movement.routes.js';
import { insuranceRoutes } from './routes/insurance.routes.js';
import { projectionRoutes } from './routes/projection.routes.js';

export async function buildApp() {
    const app = Fastify({
        logger: true,
    });

    // CORS
    await app.register(cors, {
        origin: true,
    });

    // Swagger documentation
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'MFO API',
                description: 'Multi Family Office - Wealth Projection API',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:3001',
                    description: 'Development server',
                },
            ],
            tags: [
                { name: 'Clients', description: 'Client management' },
                { name: 'Simulations', description: 'Simulation management' },
                { name: 'Assets', description: 'Asset management' },
                { name: 'Movements', description: 'Income and expense movements' },
                { name: 'Insurances', description: 'Insurance management' },
                { name: 'Projections', description: 'Wealth projection engine' },
            ],
        },
    });

    await app.register(swaggerUi, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true,
        },
    });

    // Health check
    app.get('/health', async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Routes
    await app.register(clientRoutes, { prefix: '/clients' });
    await app.register(simulationRoutes, { prefix: '/simulations' });
    await app.register(assetRoutes, { prefix: '/assets' });
    await app.register(movementRoutes, { prefix: '/movements' });
    await app.register(insuranceRoutes, { prefix: '/insurances' });
    await app.register(projectionRoutes, { prefix: '/projections' });

    return app;
}
