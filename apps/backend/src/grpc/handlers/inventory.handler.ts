import * as grpc from '@grpc/grpc-js';
import inventoryService from '../../modules/inventory/inventory.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = {
        400: grpc.status.INVALID_ARGUMENT,
        404: grpc.status.NOT_FOUND,
        409: grpc.status.ALREADY_EXISTS,
    };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapBatch(batch: any) {
    return {
        id: batch.id,
        product_id: batch.productId,
        product_name: batch.productName ?? '',
        variant_name: batch.variantName ?? '',
        quantity: batch.quantity,
        remaining_quantity: batch.remainingQuantity,
        cost_price: batch.costPrice,
        selling_price: batch.sellingPrice,
        created_at: batch.createdAt instanceof Date ? batch.createdAt.toISOString() : batch.createdAt,
    };
}

export const inventoryHandler = {
    /** POST /inventory → CreateBatch */
    createBatch: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const batch = await inventoryService.createBatch({
                productId: r.product_id,
                variantCombinationId: r.variant_combination_id || undefined,
                quantity: r.quantity,
                costPrice: r.cost_price,
                sellingPrice: r.selling_price,
            });
            callback(null, mapBatch(batch));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /inventory → GetAllBatches */
    getAllBatches: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const batches = await inventoryService.getAllBatches({
                productName: call.request.product_name || undefined,
                variantName: call.request.variant_name || undefined,
            });
            callback(null, { data: batches.map(mapBatch) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /inventory/product/:productId → GetBatchesByProduct */
    getBatchesByProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const batches = await inventoryService.getBatchesByProduct(call.request.product_id);
            callback(null, { data: batches.map(mapBatch) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /inventory/stock/:productId → GetCurrentStock */
    getCurrentStock: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const stock = await inventoryService.getCurrentStock(
                call.request.product_id,
                call.request.variant_combination_id || undefined,
            );
            callback(null, { stock });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /inventory/:id → GetBatchById */
    getBatchById: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const batch = await inventoryService.getBatchById(call.request.id);
            callback(null, mapBatch(batch));
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /inventory/:id → UpdateBatch */
    updateBatch: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const batch = await inventoryService.updateBatch(r.id, {
                quantity: r.quantity || undefined,
                costPrice: r.cost_price || undefined,
                sellingPrice: r.selling_price || undefined,
            });
            callback(null, mapBatch(batch));
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /inventory/bulk/selling-price → BulkUpdateSellingPrice */
    bulkUpdateSellingPrice: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const updates = (call.request.updates as any[]).map((u) => ({
                id: u.id,
                sellingPrice: u.selling_price,
            }));
            const result = await inventoryService.bulkUpdateSellingPrice({ updates });
            callback(null, { updated_count: result.length });
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /inventory/:id → DeleteBatch */
    deleteBatch: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const result = await inventoryService.deleteBatch(call.request.id);
            callback(null, { message: result.message });
        } catch (error) { handleError(error, callback); }
    },
};
