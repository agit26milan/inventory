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

export const updateInventoryBatchSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid batch ID'),
    }),
    body: z.object({
        quantity: z.number().int().positive().optional(),
        costPrice: z.number().positive().optional(),
        sellingPrice: z.number().positive().optional(),
    }),
});

export const getInventoryBatchSchema = z.object({
    params: z.object({
        id: z.string().transform(Number),
    }),
});

export const getAllInventoryBatchesSchema = z.object({
    query: z.object({
        productName: z.string().optional(),
        variantName: z.string().optional(),
    }).optional(),
});

export const deleteInventoryBatchSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid batch ID'),
    }),
});
