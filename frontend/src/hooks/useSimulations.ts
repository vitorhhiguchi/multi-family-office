import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulationsService } from '@/services/simulations';
import type { CreateSimulationInput, Simulation } from '@/types';

export const useSimulations = (options?: { clientId?: number; includeAllVersions?: boolean } | number) => {
    // Handle both number (legacy) and options object
    const clientId = typeof options === 'number' ? options : options?.clientId;
    const includeAllVersions = typeof options === 'object' ? options?.includeAllVersions : false;

    return useQuery({
        queryKey: ['simulations', clientId, includeAllVersions],
        queryFn: () => simulationsService.getAll(clientId, includeAllVersions),
        enabled: !!clientId,
    });
};

export const useSimulation = (id: number) => {
    return useQuery({
        queryKey: ['simulation', id],
        queryFn: () => simulationsService.getById(id),
        enabled: !!id,
    });
};

export const useCreateSimulation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSimulationInput) => simulationsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
        },
    });
};

export const useUpdateSimulation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateSimulationInput> }) =>
            simulationsService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
            queryClient.invalidateQueries({ queryKey: ['simulation', data.id] });
        },
    });
};

export const useDeleteSimulation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => simulationsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
        },
    });
};

export const useCreateSimulationVersion = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => simulationsService.createVersion(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
        },
    });
};

export const useDuplicateSimulation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) =>
            simulationsService.duplicate(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['simulations'] });
        },
    });
};

