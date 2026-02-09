export interface CreateStoreExpenseDTO {
    amount: number;
    description: string;
    category?: string;
}

export interface UpdateStoreExpenseDTO {
    amount?: number;
    description?: string;
    category?: string;
}

export interface StoreExpenseResponse {
    id: number;
    amount: number;
    description: string;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}
