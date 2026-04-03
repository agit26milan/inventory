export interface CreateVoucherDTO {
    code: string;
    name: string;
    discountType: 'NOMINAL' | 'PERCENTAGE';
    discountValue: number;
    startDate: string | Date;
    endDate: string | Date;
    isActive?: boolean;
}

export interface UpdateVoucherDTO {
    code?: string;
    name?: string;
    discountType?: 'NOMINAL' | 'PERCENTAGE';
    discountValue?: number;
    startDate?: string | Date;
    endDate?: string | Date;
    isActive?: boolean;
}

export interface VoucherResponse {
    id: string; // BigInt dari Prisma akan di-parse ke string agar aman di JSON
    code: string;
    name: string;
    discountType: 'NOMINAL' | 'PERCENTAGE';
    discountValue: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
