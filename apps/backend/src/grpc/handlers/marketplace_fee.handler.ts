import * as grpc from '@grpc/grpc-js';
import { MarketplaceFeeService } from '../../modules/marketplace-fee/marketplace-fee.service';

const feeService = new MarketplaceFeeService();

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = { 400: grpc.status.INVALID_ARGUMENT, 404: grpc.status.NOT_FOUND };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapFee(f: any) {
    return {
        id: f.id,
        product_id: f.productId,
        product_name: f.productName ?? '',
        marketplace: f.marketplace,
        percentage: f.percentage,
        process_fee: f.processFee,
        created_at: f.createdAt instanceof Date ? f.createdAt.toISOString() : (f.createdAt ?? ''),
        updated_at: f.updatedAt instanceof Date ? f.updatedAt.toISOString() : (f.updatedAt ?? ''),
    };
}

export const marketplaceFeeHandler = {
    /** POST /marketplace-fees */
    setFee: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const fee = await feeService.setFee({
                productId: r.product_id,
                marketplace: r.marketplace,
                percentage: r.percentage,
                processFee: r.process_fee,
            });
            callback(null, mapFee(fee));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /marketplace-fees/product/:productId */
    getFeesByProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const fees = await feeService.getFeesByProduct(call.request.product_id);
            callback(null, { data: fees.map(mapFee) });
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /marketplace-fees/:id */
    deleteFee: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            await feeService.deleteFee(call.request.id);
            callback(null, { message: 'Marketplace fee deleted successfully' });
        } catch (error) { handleError(error, callback); }
    },
};
