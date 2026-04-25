import * as grpc from '@grpc/grpc-js';
import { equityService } from '../../modules/equity/equity.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function handleError(error: any, callback: Callback): void {
    callback({ code: grpc.status.INTERNAL, message: error?.message ?? 'Internal server error' }, null);
}

function mapEquity(e: any) {
    return {
        id: e.id,
        amount: e.amount,
        description: e.description ?? '',
        created_at: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
    };
}

export const equityHandler = {
    /** POST /equity */
    createEquity: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const equity = await equityService.createEquity({
                amount: call.request.amount,
                description: call.request.description,
            });
            callback(null, mapEquity(equity));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /equity */
    getAllEquities: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const result = await equityService.getAllEquities(
                r.page || 1,
                r.limit || 10,
                r.month || undefined,
                r.year || undefined,
            );
            callback(null, {
                data: result.data.map(mapEquity),
                meta: result.meta,
            });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /equity/total */
    getTotalEquity: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const total = await equityService.getTotalEquity();
            callback(null, { total });
        } catch (error) { handleError(error, callback); }
    },
};
