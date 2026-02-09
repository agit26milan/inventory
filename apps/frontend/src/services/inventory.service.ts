import api from './api';
import { InventoryBatch, CreateInventoryBatchDTO, ApiResponse } from '../types';

export const inventoryService = {
    getAllBatches: async (filters?: { productName?: string; variantName?: string }): Promise<InventoryBatch[]> => {
        const params = new URLSearchParams();
        if (filters?.productName) params.append('productName', filters.productName);
        if (filters?.variantName) params.append('variantName', filters.variantName);
        
        const queryString = params.toString();
        const url = queryString ? `/inventory?${queryString}` : `/inventory`;
        
        const response = await api.get<ApiResponse<InventoryBatch[]>>(url);
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

    updateBatch: async (id: number, data: Partial<CreateInventoryBatchDTO>): Promise<InventoryBatch> => {
        const response = await api.put<ApiResponse<InventoryBatch>>(`/inventory/${id}`, data);
        return response.data.data;
    },

    getBatchById: async (id: number): Promise<InventoryBatch> => {
        const response = await api.get<ApiResponse<InventoryBatch>>(`/inventory/${id}`);
        return response.data.data;
    },

    deleteBatch: async (id: number): Promise<void> => {
        await api.delete<ApiResponse<null>>(`/inventory/${id}`);
    },
};
