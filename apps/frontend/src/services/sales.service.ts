import api from './api';
import { Sale, CreateSaleDTO, ApiResponse } from '../types';

export const salesService = {
    getAll: async (filters?: { productName?: string; variantName?: string; month?: number; year?: number }): Promise<Sale[]> => {
        const params = new URLSearchParams();
        if (filters?.productName) params.append('productName', filters.productName);
        if (filters?.variantName) params.append('variantName', filters.variantName);
        if (filters?.month) params.append('month', String(filters.month));
        if (filters?.year) params.append('year', String(filters.year));
        
        const queryString = params.toString();
        const url = queryString ? `/sales?${queryString}` : `/sales`;
        
        const response = await api.get<ApiResponse<Sale[]>>(url);
        return response.data.data;
    },

    getById: async (id: number): Promise<Sale> => {
        const response = await api.get<ApiResponse<Sale>>(`/sales/${id}`);
        return response.data.data;
    },

    create: async (data: CreateSaleDTO): Promise<Sale> => {
        const response = await api.post<ApiResponse<Sale>>('/sales', data);
        return response.data.data;
    },
};
