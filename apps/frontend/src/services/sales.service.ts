import api from './api';
import { Sale, CreateSaleDTO, ApiResponse } from '../types';

export const salesService = {
    getAll: async (): Promise<Sale[]> => {
        const response = await api.get<ApiResponse<Sale[]>>('/sales');
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
