import { z } from 'zod';

export const createMarketplaceFeeSchema = z.object({
    body: z.object({
        productId: z.number({ required_error: 'Product ID is required' }),
        marketplace: z.string({ required_error: 'Marketplace name is required' }),
        percentage: z.number({ required_error: 'Percentage is required' })
            .min(0, 'Percentage cannot be negative')
            .max(100, 'Percentage cannot be more than 100'),
    }),
});
