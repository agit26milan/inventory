import { z } from 'zod';

export const createSaleSchema = z.object({
    body: z.object({
        items: z
            .array(
                z.object({
                    productId: z.number().int().positive('Product ID must be a positive integer'),
                    quantity: z.number().int().positive('Quantity must be a positive integer'),
                })
            )
            .min(1, 'At least one item is required'),
    }),
});

export const getSaleSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid sale ID'),
    }),
});

export const getAllSalesSchema = z.object({
    query: z.object({
        productName: z.string().optional(),
        variantName: z.string().optional(),
    }),
});
