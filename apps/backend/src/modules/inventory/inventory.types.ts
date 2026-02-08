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

export interface InventoryBatchResponse {
    id: number;
    productId: number;
    productName: string;
    variantName?: string;
    quantity: number;
    remainingQuantity: number;
    costPrice: number;
    sellingPrice: number;
    createdAt: Date;
}
