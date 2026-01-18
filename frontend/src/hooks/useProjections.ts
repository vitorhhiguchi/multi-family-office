import { useQuery } from '@tanstack/react-query';
import { projectionsService } from '@/services/projections';
import type { ProjectionInput, ProjectionResult } from '@/types';

export const useProjections = (
    simulationIds: number[],
    endYear: number = 2060,
    lifeStatus: 'ALIVE' | 'DEAD' | 'INVALID' = 'ALIVE'
) => {
    return useQuery({
        queryKey: ['projections', simulationIds, endYear, lifeStatus],
        queryFn: async () => {
            if (simulationIds.length === 0) return [];

            // Fetch projections for all selected simulations in parallel
            const promises = simulationIds.map(id =>
                projectionsService.calculate({
                    simulationId: id,
                    endYear,
                    lifeStatus
                })
            );

            const results = await Promise.all(promises);
            return results;
        },
        enabled: simulationIds.length > 0,
    });
};
