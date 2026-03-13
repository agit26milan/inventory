import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equityService } from '../services/equity.service';
import { CreateEquityDTO } from '../types';

export const useEquities = (page?: number, limit?: number, month?: number, year?: number) => {
    return useQuery({
        queryKey: ['equities', page, limit, month, year],
        queryFn: () => equityService.getAllEquities(page, limit, month, year),
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
