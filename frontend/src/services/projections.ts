import api from '@/lib/api';
import type { ProjectionResult, ProjectionInput, LifeStatus } from '@/types';

export const projectionsService = {
    async generate(input: ProjectionInput): Promise<ProjectionResult> {
        // Backend expects 'status' field, not 'lifeStatus'
        const { data } = await api.post<ProjectionResult>('/projections', {
            simulationId: input.simulationId,
            endYear: input.endYear,
            status: input.lifeStatus || 'ALIVE',
        });
        return data;
    },

    async compare(
        simulationIds: number[],
        endYear: number,
        lifeStatus?: LifeStatus
    ): Promise<{ simulations: ProjectionResult[] }> {
        const { data } = await api.post<{ simulations: ProjectionResult[] }>('/projections/compare', {
            simulationIds,
            endYear,
            lifeStatus,
        });
        return data;
    },
};
