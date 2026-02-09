export interface CreateInventoryBatchDTO {
    productId: number;
    variantCombinationId?: number;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
}

export interface UpdateInventoryBatchDTO {
    quantity?: number;
    costPrice?: number;
    sellingPrice?: number;
}

export interface GetInventoryBatchesFilters {
    productName?: string;
    variantName?: string;
}

export interface InventoryBatchResponse {
    id: number;
    productId: number;
    productName: string;
    variantCombinationId?: number;
    variantName?: string;
    quantity: number;
    remainingQuantity: number;
    costPrice: number;
    sellingPrice: number;
    createdAt: Date;
    product?: {
        name: string;
    };
    variantCombination?: {
        name: string;
        sku: string;
    };
}
