import api from './api';
import { Sale, CreateSaleDTO, ApiResponse, PaginatedSales } from '../types';

export const salesService = {
    getAll: async (filters?: { productName?: string; variantName?: string; month?: number; year?: number; page?: number; limit?: number }): Promise<PaginatedSales> => {
        const params = new URLSearchParams();
        if (filters?.productName) params.append('productName', filters.productName);
        if (filters?.variantName) params.append('variantName', filters.variantName);
        if (filters?.month) params.append('month', String(filters.month));
        if (filters?.year) params.append('year', String(filters.year));
        if (filters?.page) params.append('page', String(filters.page));
        if (filters?.limit) params.append('limit', String(filters.limit));
        
        const queryString = params.toString();
        const url = queryString ? `/sales?${queryString}` : `/sales`;
        
        const response = await api.get<ApiResponse<PaginatedSales>>(url);
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
