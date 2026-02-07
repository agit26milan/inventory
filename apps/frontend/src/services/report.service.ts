import api from './api';
import {
    SalesSummary,
    ProductPerformance,
    InventoryValuation,
    ApiResponse,
} from '../types';

export const reportService = {
    getSalesSummary: async (
        startDate?: string,
        endDate?: string
    ): Promise<SalesSummary> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get<ApiResponse<SalesSummary>>(
            `/reports/sales-summary?${params.toString()}`
        );
        return response.data.data;
    },

    getProductPerformance: async (): Promise<ProductPerformance[]> => {
        const response = await api.get<ApiResponse<ProductPerformance[]>>(
            '/reports/product-performance'
        );
        return response.data.data;
    },

    getInventoryValuation: async (): Promise<InventoryValuation[]> => {
        const response = await api.get<ApiResponse<InventoryValuation[]>>(
            '/reports/inventory-valuation'
        );
        return response.data.data;
    },
};
