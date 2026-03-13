export interface CreateEquityDTO {
    amount: number;
    description: string;
}

export interface EquityResponse {
    id: number;
    amount: number;
    description: string;
    createdAt: Date;
}

export interface PaginatedEquities {
    data: EquityResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
