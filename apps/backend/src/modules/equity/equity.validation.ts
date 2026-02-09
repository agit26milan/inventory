import { z } from 'zod';

export const createEquitySchema = z.object({
    body: z.object({
        amount: z.number({ required_error: 'Amount is required' }),
        description: z.string({ required_error: 'Description is required' })
            .min(1, 'Description cannot be empty')
            .max(255, 'Description cannot exceed 255 characters'),
    }),
});
