import api from './api';
import { Equity, CreateEquityDTO, ApiResponse } from '../types';

export const equityService = {
    createEquity: async (data: CreateEquityDTO): Promise<Equity> => {
        const response = await api.post<ApiResponse<Equity>>('/equity', data);
        return response.data.data;
    },

    getAllEquities: async (): Promise<Equity[]> => {
        const response = await api.get<ApiResponse<Equity[]>>('/equity');
        return response.data.data;
    },

    getTotalEquity: async (): Promise<number> => {
        const response = await api.get<ApiResponse<{ total: number }>>('/equity/total');
        return response.data.data.total;
    },
};
