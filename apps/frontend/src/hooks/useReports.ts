import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/report.service';

export const useSalesSummary = (startDate?: string, endDate?: string) => {
    return useQuery({
        queryKey: ['reports', 'sales-summary', startDate, endDate],
        queryFn: () => reportService.getSalesSummary(startDate, endDate),
    });
};

export const useProductPerformance = () => {
    return useQuery({
        queryKey: ['reports', 'product-performance'],
        queryFn: reportService.getProductPerformance,
    });
};

export const useInventoryValuation = () => {
    return useQuery({
        queryKey: ['reports', 'inventory-valuation'],
        queryFn: reportService.getInventoryValuation,
    });
};

export const useStockAlerts = (params: {
    threshold?: number;
    page?: number;
    limit?: number;
    search?: string;
}) => {
    return useQuery({
        queryKey: ['reports', 'stock-alerts', params],
        queryFn: () =>
            reportService.getStockAlerts(
                params.threshold,
                params.page,
                params.limit,
                params.search
            ),
    });
};

export const useVariantPerformance = (page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['reports', 'variant-performance', page, limit],
        queryFn: () => reportService.getVariantPerformance(page, limit),
    });
};
