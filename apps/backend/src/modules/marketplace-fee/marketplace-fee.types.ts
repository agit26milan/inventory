export interface CreateMarketplaceFeeDTO {
    productId: number;
    marketplace: string;
    percentage: number;
    processFee: number;
}

export interface UpdateMarketplaceFeeDTO {
    percentage: number;
}

export interface MarketplaceFeeResponse {
    id: number;
    productId: number;
    productName: string;
    marketplace: string;
    percentage: number;
    createdAt: Date;
    updatedAt: Date;
    processFee?: number;
    product?: {
        name: string;
    };
}
