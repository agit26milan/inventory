import { z } from 'zod';

export const createProductSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Product name is required').max(255),
        sku: z.string().min(1, 'SKU is required').max(100),
        stockMethod: z.enum(['FIFO', 'LIFO'], {
            errorMap: () => ({ message: 'Stock method must be FIFO or LIFO' }),
        }),
        sellingPrice: z.number().positive('Selling price must be positive'),
    }),
});

export const updateProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }),
    body: z.object({
        name: z.string().min(1).max(255).optional(),
        sku: z.string().min(1).max(100).optional(),
        stockMethod: z.enum(['FIFO', 'LIFO']).optional(),
        sellingPrice: z.number().positive().optional(),
    }),
});

export const getProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }),
});

export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid product ID'),
    }),
});
