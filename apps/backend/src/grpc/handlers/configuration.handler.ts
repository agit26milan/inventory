import * as grpc from '@grpc/grpc-js';
import configurationService from '../../modules/configuration/configuration.service';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

function handleError(error: any, callback: Callback): void {
    callback({ code: grpc.status.INTERNAL, message: error?.message ?? 'Internal server error' }, null);
}

function mapConfig(c: any) {
    return { key: c.key, value: c.value, description: c.description ?? '' };
}

export const configurationHandler = {
    /** GET /configurations */
    getAll: async (_call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const configs = await configurationService.getAll();
            callback(null, { data: configs.map(mapConfig) });
        } catch (error) { handleError(error, callback); }
    },

    /** GET /configurations/:key */
    getByKey: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const config = await configurationService.getByKey(call.request.key);
            if (!config) {
                return callback({ code: grpc.status.NOT_FOUND, message: `Configuration '${call.request.key}' not found` }, null);
            }
            callback(null, mapConfig(config));
        } catch (error) { handleError(error, callback); }
    },

    /** PUT /configurations/:key */
    upsert: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const r = call.request;
            const config = await configurationService.upsert(r.key, r.value, r.description || undefined);
            callback(null, mapConfig(config));
        } catch (error) { handleError(error, callback); }
    },
};
