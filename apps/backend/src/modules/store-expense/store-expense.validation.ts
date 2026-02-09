import { z } from 'zod';

export const createStoreExpenseSchema = z.object({
    body: z.object({
        amount: z.number({ required_error: 'Amount is required' })
            .positive('Amount must be positive'),
        description: z.string({ required_error: 'Description is required' })
            .min(1, 'Description cannot be empty')
            .max(255, 'Description cannot exceed 255 characters'),
        category: z.string().max(100, 'Category cannot exceed 100 characters').optional(),
    }),
});

export const updateStoreExpenseSchema = z.object({
    params: z.object({
        id: z.string().transform(Number),
    }),
    body: z.object({
        amount: z.number().positive('Amount must be positive').optional(),
        description: z.string()
            .min(1, 'Description cannot be empty')
            .max(255, 'Description cannot exceed 255 characters')
            .optional(),
        category: z.string().max(100, 'Category cannot exceed 100 characters').optional(),
    }),
});

export const deleteStoreExpenseSchema = z.object({
    params: z.object({
        id: z.string().transform(Number),
    }),
});
