import * as grpc from '@grpc/grpc-js';
import variantService from '../../modules/variant/variant.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = { 400: grpc.status.INVALID_ARGUMENT, 404: grpc.status.NOT_FOUND };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapVariant(v: any) {
    return {
        id: v.id,
        product_id: v.productId,
        name: v.name,
        values: (v.values ?? []).map((val: any) => ({
            id: val.id,
            name: val.name,
            variant_id: val.variantId,
        })),
    };
}

export const variantHandler = {
    /** POST /variants */
    createVariant: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const variant = await variantService.createVariant({
                productId: call.request.product_id,
                name: call.request.name,
            });
            callback(null, mapVariant(variant));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /variants/product/:productId */
    getVariantsByProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const variants = await variantService.getVariantsByProductId(call.request.product_id);
            callback(null, { data: variants.map(mapVariant) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /variants/:id */
    getVariantById: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const variant = await variantService.getVariantById(call.request.id);
            callback(null, mapVariant(variant));
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /variants/:id */
    updateVariant: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const variant = await variantService.updateVariant(call.request.id, { name: call.request.name });
            callback(null, mapVariant(variant));
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /variants/:id */
    deleteVariant: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const result = await variantService.deleteVariant(call.request.id);
            callback(null, { message: result.message ?? 'Variant deleted successfully' });
        } catch (error) { handleError(error, callback); }
    },

    /** POST /variants/:variantId/values */
    createVariantValue: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const val = await variantService.createVariantValue(call.request.variant_id, { name: call.request.name });
            callback(null, { id: val.id, name: val.name, variant_id: (val as any).variantId });
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /variants/values/:id */
    updateVariantValue: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const val = await variantService.updateVariantValue(call.request.id, { name: call.request.name });
            callback(null, { id: val.id, name: val.name, variant_id: (val as any).variantId });
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /variants/values/:id */
    deleteVariantValue: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const result = await variantService.deleteVariantValue(call.request.id);
            callback(null, { message: result.message ?? 'Variant value deleted successfully' });
        } catch (error) { handleError(error, callback); }
    },
};
