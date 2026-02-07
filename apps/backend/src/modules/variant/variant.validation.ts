import { z } from 'zod';

export const createVariantSchema = z.object({
    productId: z.number().int().positive('Product ID must be a positive integer'),
    name: z.string().min(1, 'Variant name is required').max(100, 'Variant name must not exceed 100 characters'),
});

export const updateVariantSchema = z.object({
    name: z.string().min(1, 'Variant name is required').max(100, 'Variant name must not exceed 100 characters'),
});

export const createVariantValueSchema = z.object({
    name: z.string().min(1, 'Variant value name is required').max(100, 'Variant value name must not exceed 100 characters'),
});

export const updateVariantValueSchema = z.object({
    name: z.string().min(1, 'Variant value name is required').max(100, 'Variant value name must not exceed 100 characters'),
});
