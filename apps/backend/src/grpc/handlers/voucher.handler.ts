import * as grpc from '@grpc/grpc-js';
import { voucherService } from '../../modules/voucher/voucher.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = { 400: grpc.status.INVALID_ARGUMENT, 404: grpc.status.NOT_FOUND };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapVoucher(v: any) {
    return {
        id: v.id.toString(),
        code: v.code,
        name: v.name,
        discount_type: v.discountType,
        discount_value: v.discountValue,
        start_date: v.startDate instanceof Date ? v.startDate.toISOString() : v.startDate,
        end_date: v.endDate instanceof Date ? v.endDate.toISOString() : v.endDate,
        is_active: v.isActive,
        created_at: v.createdAt instanceof Date ? v.createdAt.toISOString() : (v.createdAt ?? ''),
        updated_at: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : (v.updatedAt ?? ''),
    };
}

export const voucherHandler = {
    /** POST /vouchers */
    createVoucher: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const voucher = await voucherService.createVoucher({
                code: r.code,
                name: r.name,
                discountType: r.discount_type,
                discountValue: r.discount_value,
                startDate: r.start_date,
                endDate: r.end_date,
                isActive: r.is_active,
            });
            callback(null, mapVoucher(voucher));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /vouchers */
    getAllVouchers: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const vouchers = await voucherService.getAllVouchers();
            callback(null, { data: vouchers.map(mapVoucher) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /vouchers/:id */
    getVoucherById: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const voucher = await voucherService.getVoucherById(BigInt(call.request.id));
            callback(null, mapVoucher(voucher));
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /vouchers/:id */
    updateVoucher: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const voucher = await voucherService.updateVoucher(BigInt(r.id), {
                code: r.code || undefined,
                name: r.name || undefined,
                discountType: r.discount_type || undefined,
                discountValue: r.discount_value || undefined,
                startDate: r.start_date || undefined,
                endDate: r.end_date || undefined,
                isActive: r.is_active,
            });
            callback(null, mapVoucher(voucher));
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /vouchers/:id */
    deleteVoucher: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            await voucherService.deleteVoucher(BigInt(call.request.id));
            callback(null, { message: 'Voucher deleted successfully' });
        } catch (error) { handleError(error, callback); }
    },
};
