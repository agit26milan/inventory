import api from './api';
import { 
    Variant, 
    CreateVariantDTO, 
    UpdateVariantDTO,
    VariantValue,
    CreateVariantValueDTO,
    UpdateVariantValueDTO,
    ApiResponse 
} from '../types';

export const variantService = {
    getVariantsByProduct: async (productId: number): Promise<Variant[]> => {
        const response = await api.get<ApiResponse<Variant[]>>(`/variants/product/${productId}`);
        return response.data.data;
    },

    getVariantById: async (id: number): Promise<Variant> => {
        const response = await api.get<ApiResponse<Variant>>(`/variants/${id}`);
        return response.data.data;
    },

    createVariant: async (data: CreateVariantDTO): Promise<Variant> => {
        const response = await api.post<ApiResponse<Variant>>('/variants', data);
        return response.data.data;
    },

    updateVariant: async (id: number, data: UpdateVariantDTO): Promise<Variant> => {
        const response = await api.put<ApiResponse<Variant>>(`/variants/${id}`, data);
        return response.data.data;
    },

    deleteVariant: async (id: number): Promise<void> => {
        await api.delete(`/variants/${id}`);
    },

    createVariantValue: async (variantId: number, data: CreateVariantValueDTO): Promise<VariantValue> => {
        const response = await api.post<ApiResponse<VariantValue>>(`/variants/${variantId}/values`, data);
        return response.data.data;
    },

    updateVariantValue: async (id: number, data: UpdateVariantValueDTO): Promise<VariantValue> => {
        const response = await api.put<ApiResponse<VariantValue>>(`/variants/values/${id}`, data);
        return response.data.data;
    },

    deleteVariantValue: async (id: number): Promise<void> => {
        await api.delete(`/variants/values/${id}`);
    }
};
