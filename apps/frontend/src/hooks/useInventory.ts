import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { CreateInventoryBatchDTO } from '../types';

export const useInventoryBatches = () => {
    return useQuery({
        queryKey: ['inventory'],
        queryFn: inventoryService.getAll,
    });
};

export const useInventoryByProduct = (productId: number) => {
    return useQuery({
        queryKey: ['inventory', 'product', productId],
        queryFn: () => inventoryService.getByProduct(productId),
        enabled: !!productId,
    });
};

export const useCreateInventoryBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInventoryBatchDTO) => inventoryService.createBatch(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};
