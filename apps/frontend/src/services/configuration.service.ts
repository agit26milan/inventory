import api from './api';
import { Configuration, ApiResponse } from '../types';

export const configurationService = {
    getAll: async (): Promise<Configuration[]> => {
        const response = await api.get<ApiResponse<Configuration[]>>('/configurations');
        return response.data.data;
    },

    getByKey: async (key: string): Promise<Configuration | null> => {
        try {
            const response = await api.get<ApiResponse<Configuration>>(`/configurations/${key}`);
            return response.data.data;
        } catch {
            // Kembalikan null jika config key tidak ditemukan (404)
            return null;
        }
    },

    upsert: async (key: string, value: string, description?: string): Promise<Configuration> => {
        const response = await api.put<ApiResponse<Configuration>>(`/configurations/${key}`, {
            value,
            description,
        });
        return response.data.data;
    },
};
