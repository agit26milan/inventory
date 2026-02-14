import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventory.service';
import { CreateInventoryBatchDTO } from '../types';

export const useInventoryBatches = (filters?: { productName?: string; variantName?: string }) => {
    return useQuery({
        queryKey: ['inventoryBatches', filters],
        queryFn: () => inventoryService.getAllBatches(filters),
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

export const useBulkUpdateSellingPrice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { updates: { id: number; sellingPrice: number }[] }) => 
            inventoryService.bulkUpdateSellingPrice(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
};

