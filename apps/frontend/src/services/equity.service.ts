import api from './api';
import { Equity, CreateEquityDTO, ApiResponse, PaginatedEquities } from '../types';

export const equityService = {
    createEquity: async (data: CreateEquityDTO): Promise<Equity> => {
        const response = await api.post<ApiResponse<Equity>>('/equity', data);
        return response.data.data;
    },

    getAllEquities: async (page?: number, limit?: number, month?: number, year?: number): Promise<PaginatedEquities> => {
        const params = new URLSearchParams();
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());

        const response = await api.get<ApiResponse<PaginatedEquities>>(`/equity?${params.toString()}`);
        return response.data.data;
    },

    getTotalEquity: async (): Promise<number> => {
        const response = await api.get<ApiResponse<{ total: number }>>('/equity/total');
        return response.data.data.total;
    },
};
