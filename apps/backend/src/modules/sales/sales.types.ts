export interface SaleItemDTO {
    productId: number;
    variantCombinationId?: number;
    quantity: number;
}

export interface CreateSaleDTO {
    items: SaleItemDTO[];
}

export interface SaleResponse {
    id: number;
    saleDate: Date;
    totalAmount: number;
    totalCogs: number;
    profit: number;
    items: SaleItemResponse[];
}

export interface SaleItemResponse {
    id: number;
    productId: number;
    productName: string;
    variantName?: string;
    quantity: number;
    sellingPrice: number;
    cogs: number;
    profit: number;
}

export interface GetSalesFilters {
    productName?: string;
    variantName?: string;
    /** Bulan untuk filter (1 = Januari, 12 = Desember) */
    month?: number;
    /** Tahun untuk filter, misal: 2024, 2025 */
    year?: number;
    /** Halaman saat ini untuk paginasi */
    page?: number;
    /** Batas jumlah data per halaman */
    limit?: number;
}

export interface PaginatedSales {
    data: SaleResponse[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
