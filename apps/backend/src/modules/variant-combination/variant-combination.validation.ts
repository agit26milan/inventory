import { z } from 'zod';

export const createVariantCombinationSchema = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    sku: z.string().min(1, 'SKU is required').max(100, 'SKU must not exceed 100 characters'),
    price: z.number().positive('Price must be positive'),
    stock: z.number().int().min(0, 'Stock must be non-negative'),
    variantValueIds: z.array(z.number().int().positive()).min(1, 'At least one variant value is required'),
});

export const updateVariantCombinationSchema = z.object({
    sku: z.string().min(1).max(100).optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    variantValueIds: z.array(z.number().int().positive()).min(1).optional(),
});
