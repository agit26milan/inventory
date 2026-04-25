import * as grpc from '@grpc/grpc-js';
import { storeExpenseService } from '../../modules/store-expense/store-expense.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = { 400: grpc.status.INVALID_ARGUMENT, 404: grpc.status.NOT_FOUND };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

function handleError(error: any, callback: Callback): void {
    callback({ code: toGrpcStatus(error?.statusCode ?? 500), message: error?.message ?? 'Internal server error' }, null);
}

function mapExpense(e: any) {
    return {
        id: e.id,
        description: e.description ?? '',
        amount: e.amount,
        category: e.category ?? '',
        created_at: e.createdAt instanceof Date ? e.createdAt.toISOString() : (e.createdAt ?? ''),
    };
}

export const storeExpenseHandler = {
    /** POST /store-expenses */
    createExpense: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const expense = await storeExpenseService.createExpense({
                description: call.request.description,
                amount: call.request.amount,
                category: call.request.category,
            });
            callback(null, mapExpense(expense));
        } catch (error) { handleError(error, callback); }
    },

    /** GET /store-expenses */
    getAllExpenses: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const expenses = await storeExpenseService.getAllExpenses(
                r.month || undefined,
                r.year || undefined,
            );
            callback(null, { data: expenses.map(mapExpense) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /store-expenses/total */
    getTotalExpenses: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const total = await storeExpenseService.getTotalExpenses();
            callback(null, { total });
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /store-expenses/:id */
    updateExpense: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const expense = await storeExpenseService.updateExpense(r.id, {
                description: r.description || undefined,
                amount: r.amount || undefined,
                category: r.category || undefined,
            });
            callback(null, mapExpense(expense));
        } catch (error) { handleError(error, callback); }
    },

    /** DELETE /store-expenses/:id */
    deleteExpense: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            await storeExpenseService.deleteExpense(call.request.id);
            callback(null, { message: 'Store expense deleted successfully' });
        } catch (error) { handleError(error, callback); }
    },
};
