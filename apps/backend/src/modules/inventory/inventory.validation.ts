import { z } from 'zod';

export const createInventoryBatchSchema = z.object({
    body: z.object({
        productId: z.number().int().positive('Product ID must be a positive integer'),
        quantity: z.number().int().positive('Quantity must be a positive integer'),
        costPrice: z.number().positive('Cost price must be positive'),
    }),
});

export const getInventoryByProductSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }),
});
