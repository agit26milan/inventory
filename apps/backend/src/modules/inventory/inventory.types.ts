export interface CreateInventoryBatchDTO {
    productId: number;
    quantity: number;
    costPrice: number;
}

export interface InventoryBatchResponse {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    remainingQuantity: number;
    costPrice: number;
    createdAt: Date;
}
