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

export interface VariantValueResponse {
    id: number;
    variantId: number;
    productId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface VariantResponse {
    id: number;
    productId: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    values?: VariantValueResponse[];
}
