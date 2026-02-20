import { z } from 'zod';

export const upsertConfigurationSchema = z.object({
    params: z.object({
        key: z.string().min(1).max(100),
    }),
    body: z.object({
        value: z.string().min(1).max(255),
        description: z.string().max(255).optional(),
    }),
    query: z.object({}),
});
