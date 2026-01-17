import { prisma } from '../lib/prisma.js';
import { ProjectionEngine, type ProjectionResult } from '../engine/projection.engine.js';
import type { CreateProjectionInput, LifeStatus } from '../schemas/projection.schema.js';

export class ProjectionService {
    async generateProjection(data: CreateProjectionInput): Promise<ProjectionResult> {
        const simulation = await prisma.simulation.findUnique({
            where: { id: data.simulationId },
            include: {
                assets: {
                    include: {
                        records: {
                            orderBy: { date: 'desc' },
                        },
                        financing: true,
                    },
                },
                movements: {
                    orderBy: { startDate: 'asc' },
                },
                insurances: {
                    orderBy: { startDate: 'asc' },
                },
            },
        });

        if (!simulation) {
            throw new Error('Simulation not found');
        }

        const engine = new ProjectionEngine(
            simulation,
            data.status as LifeStatus,
            data.endYear
        );

        return engine.run();
    }

    async compareProjections(
        simulationIds: number[],
        status: LifeStatus,
        endYear: number = 2060
    ): Promise<ProjectionResult[]> {
        const results: ProjectionResult[] = [];

        for (const id of simulationIds) {
            const result = await this.generateProjection({
                simulationId: id,
                status,
                endYear,
            });
            results.push(result);
        }

        return results;
    }
}

export const projectionService = new ProjectionService();
