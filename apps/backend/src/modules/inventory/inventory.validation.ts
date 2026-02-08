import { z } from 'zod';

export const createInventoryBatchSchema = z.object({
    body: z.object({
        productId: z.number().int().positive(),
        variantCombinationId: z.number().int().positive().optional(),
        quantity: z.number().int().positive(),
        costPrice: z.number().positive(),
        sellingPrice: z.number().positive(),
    }),
});

export const getInventoryByProductSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }),
});
