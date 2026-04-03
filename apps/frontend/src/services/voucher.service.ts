import api from './api';
import { Voucher, CreateVoucherDTO, UpdateVoucherDTO, ApiResponse } from '../types';

export const voucherService = {
    getAll: async (): Promise<Voucher[]> => {
        const response = await api.get<ApiResponse<Voucher[]>>('/vouchers');
        return response.data.data;
    },

    getById: async (id: string): Promise<Voucher> => {
        const response = await api.get<ApiResponse<Voucher>>(`/vouchers/${id}`);
        return response.data.data;
    },

    create: async (data: CreateVoucherDTO): Promise<Voucher> => {
        const response = await api.post<ApiResponse<Voucher>>('/vouchers', data);
        return response.data.data;
    },

    update: async (id: string, data: UpdateVoucherDTO): Promise<Voucher> => {
        const response = await api.put<ApiResponse<Voucher>>(`/vouchers/${id}`, data);
        return response.data.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete<ApiResponse<null>>(`/vouchers/${id}`);
    },
};
