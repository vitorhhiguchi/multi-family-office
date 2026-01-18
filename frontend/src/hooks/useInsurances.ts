import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insurancesService } from '@/services/insurances';
import type { CreateInsuranceInput } from '@/types';

export const useInsurances = (simulationId?: number) => {
    return useQuery({
        queryKey: ['insurances', simulationId],
        queryFn: () => {
            if (!simulationId) return [];
            return insurancesService.getAll(simulationId);
        },
        enabled: !!simulationId,
    });
};

export const useCreateInsurance = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInsuranceInput) => insurancesService.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['insurances', variables.simulationId] });
            queryClient.invalidateQueries({ queryKey: ['projections', variables.simulationId] });
        },
    });
};

export const useUpdateInsurance = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateInsuranceInput> }) =>
            insurancesService.update(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['insurances', data.simulationId] });
            queryClient.invalidateQueries({ queryKey: ['projections', data.simulationId] });
        },
    });
};

export const useDeleteInsurance = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, simulationId }: { id: number; simulationId: number }) =>
            insurancesService.delete(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['insurances', variables.simulationId] });
            queryClient.invalidateQueries({ queryKey: ['projections', variables.simulationId] });
        },
    });
};
