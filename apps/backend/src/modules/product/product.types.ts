import { StockMethod } from '@prisma/client';

export interface CreateProductDTO {
    name: string;
    sku: string;
    stockMethod: StockMethod;
    sellingPrice: number;
}

export interface UpdateProductDTO {
    name?: string;
    sku?: string;
    stockMethod?: StockMethod;
    sellingPrice?: number;
}

export interface ProductWithStock {
    id: number;
    name: string;
    sku: string;
    stockMethod: StockMethod;
    sellingPrice: number;
    currentStock: number;
    createdAt: Date;
    updatedAt: Date;
}
