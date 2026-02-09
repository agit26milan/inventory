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
