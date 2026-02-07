export interface CreateVariantCombinationDTO {
    productId: number;
    sku: string;
    price: number;
    stock: number;
    variantValueIds: number[];
}

export interface UpdateVariantCombinationDTO {
    sku?: string;
    price?: number;
    stock?: number;
    variantValueIds?: number[];
}

export interface VariantCombinationValueDetail {
    id: number;
    name: string;
    variantId: number;
    variantName: string;
}

export interface VariantCombinationResponse {
    id: number;
    productId: number;
    sku: string;
    price: number;
    stock: number;
    createdAt: Date;
    updatedAt: Date;
    values?: VariantCombinationValueDetail[];
}
