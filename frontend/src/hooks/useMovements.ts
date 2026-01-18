import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsService } from '@/services/movements';
import type { CreateMovementInput, MovementType } from '@/types';

export const useMovements = (simulationId?: number, type?: MovementType) => {
    return useQuery({
        queryKey: ['movements', simulationId, type],
        queryFn: () => {
            if (!simulationId) return [];
            return movementsService.getAll(simulationId, type);
        },
        enabled: !!simulationId,
    });
};

export const useCreateMovement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateMovementInput) => movementsService.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['movements', variables.simulationId] });
            // Invalidate projections as well since movements affect them
            queryClient.invalidateQueries({ queryKey: ['projections', variables.simulationId] });
        },
    });
};

export const useUpdateMovement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateMovementInput> }) =>
            movementsService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['movements', data.simulationId] });
            queryClient.invalidateQueries({ queryKey: ['projections', data.simulationId] });
        },
    });
};

export const useDeleteMovement = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, simulationId }: { id: number; simulationId: number }) =>
            movementsService.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['movements', variables.simulationId] });
            queryClient.invalidateQueries({ queryKey: ['projections', variables.simulationId] });
        },
    });
};
