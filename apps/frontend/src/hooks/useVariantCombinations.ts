import { useQuery } from '@tanstack/react-query';
import { variantCombinationService } from '../services/variantCombination.service';

export const useVariantCombinations = (productId: number) => {
    return useQuery({
        queryKey: ['variantCombinations', productId],
        queryFn: () => variantCombinationService.getByProduct(productId),
        enabled: !!productId,
    });
};
