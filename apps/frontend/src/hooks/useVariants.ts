import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { variantService } from '../services/variant.service';
import { 
    CreateVariantDTO, 
    UpdateVariantDTO, 
    CreateVariantValueDTO, 
    UpdateVariantValueDTO 
} from '../types';

export const useVariants = (productId: number) => {
    return useQuery({
        queryKey: ['variants', productId],
        queryFn: () => variantService.getVariantsByProduct(productId),
        enabled: !!productId,
    });
};

export const useCreateVariant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateVariantDTO) => variantService.createVariant(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['variants', variables.productId] });
        },
    });
};

export const useUpdateVariant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateVariantDTO }) => 
            variantService.updateVariant(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
        },
    });
};

export const useDeleteVariant = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => variantService.deleteVariant(id),
        onSuccess: () => {
             // We can't easily get productId here without passing it, 
             // but strictly we should invalidate the specific product's variants.
             // For now, invalidating all 'variants' queries is a safe enough approach or we can rely on parent to refetch.
             // Better: invalidate all 'variants' queries.
             queryClient.invalidateQueries({ queryKey: ['variants'] });
        },
    });
};

export const useCreateVariantValue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ variantId, data }: { variantId: number; data: CreateVariantValueDTO }) => 
            variantService.createVariantValue(variantId, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
        },
    });
};

export const useUpdateVariantValue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateVariantValueDTO }) => 
            variantService.updateVariantValue(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['variants', data.productId] });
        },
    });
};

export const useDeleteVariantValue = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => variantService.deleteVariantValue(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variants'] });
        },
    });
};
