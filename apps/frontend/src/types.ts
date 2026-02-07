export type StockMethod = 'FIFO' | 'LIFO';

export interface Product {
    id: number;
    name: string;
    sku: string;
    stockMethod: StockMethod;
    sellingPrice: number;
    currentStock: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDTO {
    name: string;
    sku: string;
    stockMethod: StockMethod;
    sellingPrice: number;
}

export interface InventoryBatch {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    remainingQuantity: number;
    costPrice: number;
    createdAt: string;
}

export interface CreateInventoryBatchDTO {
    productId: number;
    quantity: number;
    costPrice: number;
}

export interface SaleItem {
    productId: number;
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

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
