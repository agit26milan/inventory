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

export const useUpdateInventoryBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateInventoryBatchDTO> }) => 
            inventoryService.updateBatch(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

export const useInventoryBatch = (id: number | null) => {
    return useQuery({
        queryKey: ['inventory', id],
        queryFn: () => inventoryService.getBatchById(id!),
        enabled: !!id,
    });
};

export const useDeleteInventoryBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => inventoryService.deleteBatch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
};

