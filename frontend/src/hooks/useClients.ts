import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '@/services/clients';
import type { CreateClientInput } from '@/types';

export const useClients = () => {
    return useQuery({
        queryKey: ['clients'],
        queryFn: clientsService.getAll,
    });
};

export const useCreateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateClientInput) => clientsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
};
