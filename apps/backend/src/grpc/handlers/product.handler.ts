import * as grpc from '@grpc/grpc-js';
import productService from '../../modules/product/product.service';
import { createProductSchema, updateProductSchema } from '../../modules/product/product.validation';

type UnaryCall = grpc.ServerUnaryCall<any, any>;
type Callback = grpc.sendUnaryData<any>;

/** Konversi AppError HTTP status ke gRPC status code */
function toGrpcStatus(httpStatus: number): grpc.status {
    const map: Record<number, grpc.status> = {
        400: grpc.status.INVALID_ARGUMENT,
        401: grpc.status.UNAUTHENTICATED,
        403: grpc.status.PERMISSION_DENIED,
        404: grpc.status.NOT_FOUND,
        409: grpc.status.ALREADY_EXISTS,
    };
    return map[httpStatus] ?? grpc.status.INTERNAL;
}

/** Helper untuk handle error dari service layer */
function handleError(error: any, callback: Callback): void {
    const code = toGrpcStatus(error?.statusCode ?? 500);
    callback({ code, message: error?.message ?? 'Internal server error' }, null);
}

export const productHandler = {
    /** GET /products → GetProducts (dengan pagination) */
    getProducts: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const page = call.request.page || 1;
            const limit = call.request.limit || 10;
            const search = call.request.search || '';

            const allProducts = await productService.getAllProducts();

            // Filter by search jika ada
            const filtered = search
                ? allProducts.filter(
                      (p) =>
                          p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase())
                  )
                : allProducts;

            // Pagination manual (karena service belum support cursor)
            const total = filtered.length;
            const start = (page - 1) * limit;
            const data = filtered.slice(start, start + limit).map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                stock_method: p.stockMethod,
                current_stock: p.currentStock,
                created_at: p.createdAt.toISOString(),
                updated_at: p.updatedAt.toISOString(),
            }));

            callback(null, { data, total, page, limit });
        } catch (error) {
            handleError(error, callback);
        }
    },

    /** POST /products → CreateProduct */
    createProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const parsed = createProductSchema.safeParse({
                body: {
                    name: call.request.name,
                    sku: call.request.sku,
                    stockMethod: call.request.stock_method,
                },
            });

            if (!parsed.success) {
                return callback(
                    {
                        code: grpc.status.INVALID_ARGUMENT,
                        message: parsed.error.errors.map((e) => e.message).join(', '),
                    },
                    null
                );
            }

            const product = await productService.createProduct({
                name: call.request.name,
                sku: call.request.sku,
                stockMethod: call.request.stock_method,
            });

            callback(null, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock_method: product.stockMethod,
                current_stock: 0,
                created_at: product.createdAt.toISOString(),
                updated_at: product.updatedAt.toISOString(),
            });
        } catch (error) {
            handleError(error, callback);
        }
    },

    /** GET /products/:id → GetProductById */
    getProductById: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const id = call.request.id;
            if (!id || isNaN(id)) {
                return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'id must be a number' }, null);
            }

            const product = await productService.getProductById(id);

            callback(null, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock_method: product.stockMethod,
                current_stock: product.currentStock,
                created_at: product.createdAt.toISOString(),
                updated_at: product.updatedAt.toISOString(),
            });
        } catch (error) {
            handleError(error, callback);
        }
    },

    /** GET /products/:id/with-variants → GetProductWithVariants */
    getProductWithVariants: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const id = call.request.id;
            if (!id || isNaN(id)) {
                return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'id must be a number' }, null);
            }

            const product = await productService.getProductWithVariants(id);

            callback(null, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock_method: product.stockMethod,
                current_stock: product.currentStock,
                created_at: product.createdAt.toISOString(),
                updated_at: product.updatedAt.toISOString(),
                variants: product.variants.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    values: v.values.map((val: any) => ({ id: val.id, name: val.name })),
                })),
                variant_combinations: product.variantCombinations.map((c: any) => ({
                    id: c.id,
                    sku: c.sku,
                    stock: c.stock,
                    values: c.values.map((val: any) => ({
                        id: val.id,
                        name: val.name,
                        variant_id: val.variantId,
                        variant_name: val.variantName,
                    })),
                })),
            });
        } catch (error) {
            handleError(error, callback);
        }
    },

    /** PUT /products/:id → UpdateProduct */
    updateProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const id = call.request.id;
            if (!id || isNaN(id)) {
                return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'id must be a number' }, null);
            }

            const parsed = updateProductSchema.safeParse({
                params: { id: String(id) },
                body: {
                    name: call.request.name || undefined,
                    sku: call.request.sku || undefined,
                    stockMethod: call.request.stock_method || undefined,
                },
            });

            if (!parsed.success) {
                return callback(
                    {
                        code: grpc.status.INVALID_ARGUMENT,
                        message: parsed.error.errors.map((e) => e.message).join(', '),
                    },
                    null
                );
            }

            const product = await productService.updateProduct(id, {
                name: call.request.name || undefined,
                sku: call.request.sku || undefined,
                stockMethod: call.request.stock_method || undefined,
            });

            callback(null, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                stock_method: product.stockMethod,
                current_stock: 0,
                created_at: product.createdAt.toISOString(),
                updated_at: product.updatedAt.toISOString(),
            });
        } catch (error) {
            handleError(error, callback);
        }
    },

    /** DELETE /products/:id → DeleteProduct */
    deleteProduct: async (call: UnaryCall, callback: Callback): Promise<void> => {
        try {
            const id = call.request.id;
            if (!id || isNaN(id)) {
                return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'id must be a number' }, null);
            }

            const result = await productService.deleteProduct(id);
            callback(null, { message: result.message });
        } catch (error) {
            handleError(error, callback);
        }
    },
};
