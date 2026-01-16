import { buildApp } from './app';
import { config } from './config';

async function start() {
    const app = await buildApp();

    try {
        await app.listen({ port: config.port, host: config.host });
        // eslint-disable-next-line no-console
        console.log(`🚀 Server running at http://${config.host}:${config.port}`);
        // eslint-disable-next-line no-console
        console.log(`📚 Docs available at http://${config.host}:${config.port}/docs`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();
