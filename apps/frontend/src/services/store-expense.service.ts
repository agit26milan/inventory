import api from './api';
import { StoreExpense, CreateStoreExpenseDTO, UpdateStoreExpenseDTO, ApiResponse } from '../types';

export const storeExpenseService = {
    createExpense: async (data: CreateStoreExpenseDTO): Promise<StoreExpense> => {
        const response = await api.post<ApiResponse<StoreExpense>>('/store-expenses', data);
        return response.data.data;
    },

    getAllExpenses: async (): Promise<StoreExpense[]> => {
        const response = await api.get<ApiResponse<StoreExpense[]>>('/store-expenses');
        return response.data.data;
    },

    updateExpense: async (id: number, data: UpdateStoreExpenseDTO): Promise<StoreExpense> => {
        const response = await api.put<ApiResponse<StoreExpense>>(`/store-expenses/${id}`, data);
        return response.data.data;
    },

    deleteExpense: async (id: number): Promise<void> => {
        await api.delete<ApiResponse<null>>(`/store-expenses/${id}`);
    },

    getTotalExpenses: async (): Promise<number> => {
        const response = await api.get<ApiResponse<{ total: number }>>('/store-expenses/total');
        return response.data.data.total;
    },
};
