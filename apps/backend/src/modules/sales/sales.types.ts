export interface SaleItemDTO {
    productId: number;
    variantCombinationId?: number;
    quantity: number;
}

export interface CreateSaleDTO {
    items: SaleItemDTO[];
}

export interface SaleResponse {
    id: number;
    saleDate: Date;
    totalAmount: number;
    totalCogs: number;
    profit: number;
    items: SaleItemResponse[];
}

export interface SaleItemResponse {
    id: number;
    productId: number;
    productName: string;
    variantName?: string;
    quantity: number;
    sellingPrice: number;
    cogs: number;
    profit: number;
}
