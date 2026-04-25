import * as grpc from '@grpc/grpc-js';
import reportService from '../../modules/report/report.service';
import configurationService from '../../modules/configuration/configuration.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function handleError(error: any, callback: Callback): void {
    callback({ code: grpc.status.INTERNAL, message: error?.message ?? 'Internal server error' }, null);
}

export const reportHandler = {
    /** GET /reports/sales-summary */
    getSalesSummary: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const start = r.start_date ? new Date(r.start_date) : undefined;
            const end = r.end_date ? new Date(r.end_date) : undefined;
            const summary = await reportService.getSalesSummary(start, end);
            callback(null, summary);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/product-performance */
    getProductPerformance: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const data = await reportService.getProductPerformance();
            callback(null, { data });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/variant-performance */
    getVariantPerformance: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const stockSort: 'asc' | 'desc' | undefined =
                r.stock_sort === 'asc' || r.stock_sort === 'desc' ? r.stock_sort : undefined;
            const qtySort: 'asc' | 'desc' | undefined =
                r.qty_sort === 'asc' || r.qty_sort === 'desc' ? r.qty_sort : undefined;
            const result = await reportService.getVariantPerformance(
                r.page || 1,
                r.limit || 10,
                r.product_name || undefined,
                r.variant_name || undefined,
                stockSort,
                qtySort,
            );
            callback(null, result);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/inventory-valuation */
    getInventoryValuation: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const data = await reportService.getInventoryValuation();
            callback(null, data);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/stock-alerts */
    getStockAlerts: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            let threshold = r.threshold;
            if (!threshold) {
                const config = await configurationService.getByKey('stock_alert_threshold');
                threshold = config ? parseInt(config.value, 10) : 5;
            }
            const result = await reportService.getStockAlerts(threshold, r.page || 1, r.limit || 10, r.search || undefined);
            callback(null, result);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/sales-timeframe */
    getSalesTimeframe: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const result = await reportService.getSalesTimeframe(r.page || 1, r.limit || 10, r.search || undefined);
            callback(null, result);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/annual-sales */
    getAnnualSales: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const result = await reportService.getAnnualSales(
                r.year || new Date().getFullYear(),
                r.month || undefined,
                r.page || 1,
                r.limit || 10,
                r.search || undefined,
            );
            callback(null, result);
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/monthly-profit */
    getMonthlyProfit: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const year = call.request.year || new Date().getFullYear();
            const result = await reportService.getMonthlyProfit(year);
            callback(null, { data: result });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /reports/owner-withdrawal */
    getMonthlyOwnerWithdrawal: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const year = call.request.year || new Date().getFullYear();
            const result = await reportService.getMonthlyOwnerWithdrawal(year);
            callback(null, { data: result });
        } catch (error) { handleError(error, callback); }
    },
};
