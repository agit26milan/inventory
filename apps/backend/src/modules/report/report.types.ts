export interface SalesSummaryReport {
    totalSales: number;
    totalCogs: number;
    totalProfit: number;
    profitMargin: number;
    numberOfTransactions: number;
}

export interface ProductPerformanceReport {
    productId: number;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    totalCogs: number;
    totalProfit: number;
}

export interface InventoryValuationReport {
    productId: number;
    productName: string;
    currentStock: number;
    averageCostPrice: number;
    totalValue: number;
}

export interface StockAlertReport {
    productId: number;
    productName: string;
    combinationId: number;
    variantName: string;
    sku: string;
    currentStock: number;
    threshold: number;
}

export interface PaginatedStockAlerts {
    data: StockAlertReport[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface VariantPerformanceReport {
    productId: number;
    productName: string;
    combinationId: number | null;
    variantName: string;
    sku: string;
    totalQuantitySold: number;
    totalRevenue: number;
    totalCogs: number;
    totalProfit: number;
}

export interface PaginatedVariantPerformance {
    data: VariantPerformanceReport[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SalesTimeframeReport {
    productId: number;
    productName: string;
    sold1Day: number;
    sold7Days: number;
    sold30Days: number;
}

export interface PaginatedSalesTimeframe {
    data: SalesTimeframeReport[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface SalesTimeframeReport {
    productId: number;
    productName: string;
    sold1Day: number;
    sold7Days: number;
    sold30Days: number;
}

export interface PaginatedSalesTimeframe {
    data: SalesTimeframeReport[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

