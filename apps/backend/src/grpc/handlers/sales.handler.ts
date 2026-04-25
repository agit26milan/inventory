import * as grpc from '@grpc/grpc-js';
import salesService from '../../modules/sales/sales.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = {
        400: grpc.status.INVALID_ARGUMENT,
        404: grpc.status.NOT_FOUND,
    };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapSale(sale: any) {
    return {
        id: sale.id,
        sale_date: sale.saleDate instanceof Date ? sale.saleDate.toISOString() : sale.saleDate,
        total_amount: sale.totalAmount,
        total_cogs: sale.totalCogs,
        profit: sale.profit,
        voucher_discount: sale.voucherDiscount ?? 0,
        voucher_code: sale.voucherCode ?? '',
        items: (sale.items ?? []).map((item: any) => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.productName,
            variant_name: item.variantName ?? '',
            quantity: item.quantity,
            selling_price: item.sellingPrice,
            cogs: item.cogs,
            profit: item.profit,
        })),
    };
}

export const salesHandler = {
    /** POST /sales → CreateSale */
    createSale: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const sale = await salesService.createSale({
                items: (r.items as any[]).map((i) => ({
                    productId: i.product_id,
                    variantCombinationId: i.variant_combination_id || undefined,
                    quantity: i.quantity,
                })),
                voucherId: r.voucher_id || undefined,
            });
            callback(null, mapSale(sale));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /sales → GetAllSales */
    getAllSales: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const result = await salesService.getAllSales({
                page: r.page || 1,
                limit: r.limit || 10,
                month: r.month || undefined,
                year: r.year || undefined,
                productName: r.product_name || undefined,
                variantName: r.variant_name || undefined,
            });
            callback(null, {
                data: result.data.map(mapSale),
                meta: result.meta,
            });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /sales/:id → GetSaleById */
    getSaleById: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const sale = await salesService.getSaleById(call.request.id);
            callback(null, mapSale(sale));
        } catch (error) { handleError(error, callback); }
    },
};
