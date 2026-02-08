import { StockMethod } from '@prisma/client';

export interface CreateProductDTO {
    name: string;
    sku: string;
    stockMethod: StockMethod;
}

export interface UpdateProductDTO {
    name?: string;
    sku?: string;
    stockMethod?: StockMethod;
}

export interface ProductWithStock {
    id: number;
    name: string;
    sku: string;
    stockMethod: StockMethod;
    currentStock: number;
    createdAt: Date;
    updatedAt: Date;
}
