import api from './api';
import { 
    VariantCombination, 
    ApiResponse 
} from '../types';

export const variantCombinationService = {
    getByProduct: async (productId: number): Promise<VariantCombination[]> => {
        const response = await api.get<ApiResponse<VariantCombination[]>>(`/variant-combinations/product/${productId}`);
        return response.data.data;
    },
};
