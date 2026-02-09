import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import { CreateSaleDTO } from '../types';

export const useSales = (filters?: { productName?: string; variantName?: string }) => {
    return useQuery({
        queryKey: ['sales', filters],
        queryFn: () => salesService.getAll(filters),
    });
};

export const useSale = (id: number) => {
    return useQuery({
        queryKey: ['sale', id],
        queryFn: () => salesService.getById(id),
        enabled: !!id,
    });
};

export const useCreateSale = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateSaleDTO) => salesService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};
