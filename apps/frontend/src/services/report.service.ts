import api from './api';
import {
    SalesSummary,
    ProductPerformance,
    InventoryValuation,
    PaginatedStockAlerts,
    PaginatedVariantPerformance,
    PaginatedSalesTimeframe,
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

    getStockAlerts: async (
        threshold?: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedStockAlerts> => {
        const params = new URLSearchParams();
        if (threshold !== undefined) params.append('threshold', threshold.toString());
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) params.append('search', search);

        const response = await api.get<ApiResponse<PaginatedStockAlerts>>(
            `/reports/stock-alerts?${params.toString()}`
        );
        return response.data.data;
    },

    getVariantPerformance: async (
        page: number = 1,
        limit: number = 10
    ): Promise<PaginatedVariantPerformance> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await api.get<ApiResponse<PaginatedVariantPerformance>>(
            `/reports/variant-performance?${params.toString()}`
        );
        return response.data.data;
    },

    getSalesTimeframe: async (
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedSalesTimeframe> => {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        if (search) {
            params.append('search', search);
        }

        const response = await api.get<ApiResponse<PaginatedSalesTimeframe>>(
            `/reports/sales-timeframe?${params.toString()}`
        );
        return response.data.data;
    },
};
