import api from './api';
import { Product, CreateProductDTO, ApiResponse } from '../types';

export const productService = {
    getAll: async (): Promise<Product[]> => {
        const response = await api.get<ApiResponse<Product[]>>('/products');
        return response.data.data;
    },

    getById: async (id: number): Promise<Product> => {
        const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
        return response.data.data;
    },

    create: async (data: CreateProductDTO): Promise<Product> => {
        const response = await api.post<ApiResponse<Product>>('/products', data);
        return response.data.data;
    },

    update: async (id: number, data: Partial<CreateProductDTO>): Promise<Product> => {
        const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/products/${id}`);
    },
};
