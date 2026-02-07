import api from './api';
import { InventoryBatch, CreateInventoryBatchDTO, ApiResponse } from '../types';

export const inventoryService = {
    getAll: async (): Promise<InventoryBatch[]> => {
        const response = await api.get<ApiResponse<InventoryBatch[]>>('/inventory');
        return response.data.data;
    },

    getByProduct: async (productId: number): Promise<InventoryBatch[]> => {
        const response = await api.get<ApiResponse<InventoryBatch[]>>(
            `/inventory/product/${productId}`
        );
        return response.data.data;
    },

    createBatch: async (data: CreateInventoryBatchDTO): Promise<InventoryBatch> => {
        const response = await api.post<ApiResponse<InventoryBatch>>('/inventory', data);
        return response.data.data;
    },

    getCurrentStock: async (productId: number): Promise<number> => {
        const response = await api.get<ApiResponse<{ productId: number; currentStock: number }>>(
            `/inventory/stock/${productId}`
        );
        return response.data.data.currentStock;
    },
};
