import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equityService } from '../services/equity.service';
import { CreateEquityDTO } from '../types';

export const useEquities = () => {
    return useQuery({
        queryKey: ['equities'],
        queryFn: equityService.getAllEquities,
    });
};

export const useCreateEquity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateEquityDTO) => equityService.createEquity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equities'] });
            queryClient.invalidateQueries({ queryKey: ['totalEquity'] });
        },
    });
};

export const useTotalEquity = () => {
    return useQuery({
        queryKey: ['totalEquity'],
        queryFn: equityService.getTotalEquity,
    });
};
