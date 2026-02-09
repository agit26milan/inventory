export type StockMethod = 'FIFO' | 'LIFO';

export interface Product {
    id: number;
    name: string;
    sku: string;
    stockMethod: StockMethod;
    currentStock: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    name: string;
    sku: string;
    stockMethod: StockMethod;
}

export interface InventoryBatch {
    id: number;
    productId: number;
    productName: string;
    variantCombinationId?: number;
    variantName?: string;
    quantity: number;
    remainingQuantity: number;
    costPrice: number;
    sellingPrice: number;
    createdAt: string;
}

export interface CreateInventoryBatchDTO {
    productId: number;
    variantCombinationId?: number;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
}

export interface SaleItem {
    productId: number;
    variantCombinationId?: number;
    quantity: number;
}

export interface CreateSaleDTO {
    items: SaleItem[];
}

export interface Sale {
    id: number;
    saleDate: string;
    totalAmount: number;
    totalCogs: number;
    profit: number;
    items: SaleItemDetail[];
}

export interface SaleItemDetail {
    id: number;
    productId: number;
    productName: string;
    variantName?: string;
    quantity: number;
    sellingPrice: number;
    cogs: number;
    profit: number;
}

export interface SalesSummary {
    totalSales: number;
    totalCogs: number;
    totalProfit: number;
    profitMargin: number;
    numberOfTransactions: number;
}

export interface ProductPerformance {
    productId: number;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    totalCogs: number;
    totalProfit: number;
}

export interface InventoryValuation {
    productId: number;
    productName: string;
    currentStock: number;
    averageCostPrice: number;
    totalValue: number;
}


export interface VariantValue {
    id: number;
    variantId: number;
    productId: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface Variant {
    id: number;
    productId: number;
    name: string;
    createdAt: string;
    updatedAt: string;
    values?: VariantValue[];
}

export interface CreateVariantDTO {
    productId: number;
    name: string;
}

export interface UpdateVariantDTO {
    name: string;
}

export interface CreateVariantValueDTO {
    name: string;
}

export interface UpdateVariantValueDTO {
    name: string;
}

export interface VariantCombination {
    id: number;
    productId: number;
    sku: string;
    stock: number;
    createdAt: string;
    updatedAt: string;
    values?: VariantCombinationValue[];
}

export interface VariantCombinationValue {
     combinationId: number;
     variantValueId: number;
     variantValue: VariantValue;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface MarketplaceFee {
    id: number;
    productId: number;
    productName: string;
    marketplace: string;
    percentage: number;
    processFee: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMarketplaceFeeDTO {
    productId: number;
    marketplace: string;
    percentage: number;
    processFee: number;
}
