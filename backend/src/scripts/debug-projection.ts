
import { prisma } from '../lib/prisma.js';
import { ProjectionEngine } from '../engine/projection.engine.js';

async function main() {
    console.log('--- Debugging Projection ---');

    // 1. Fetch all simulations to find the one with assets
    const simulations = await prisma.simulation.findMany({
        include: {
            assets: {
                include: { records: true }
            }
        }
    });

    console.log(`Found ${simulations.length} simulations.`);

    for (const sim of simulations) {
        if (sim.assets.length > 0) {
            console.log(`\nChecking Simulation: ${sim.name} (ID: ${sim.id})`);
            console.log(`Start Date: ${sim.startDate.toISOString()}`);
            console.log(`Assets: ${sim.assets.length}`);

            sim.assets.forEach(a => {
                console.log(`  - Asset: ${a.name} (${a.type})`);
                console.log(`    Records: ${a.records.length}`);
                a.records.forEach(r => {
                    console.log(`      * ${r.date.toISOString()} : ${r.value}`);
                });
            });

            // 2. Run Engine
            console.log('Running Engine...');
            const fullSim = await prisma.simulation.findUnique({
                where: { id: sim.id },
                include: {
                    assets: { include: { records: true, financing: true } },
                    movements: true,
                    insurances: true
                }
            });

            if (fullSim) {
                const engine = new ProjectionEngine(fullSim as any, 'ALIVE', 2060);
                const result = engine.run();
                console.log('Projection Result Year 0 (Start):', result.projections[0]);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
