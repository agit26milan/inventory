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
        // ID Voucher yang digunakan (opsional), dikirim sebagai string
        voucherId: z.string().regex(/^\d+$/, 'Invalid voucher ID').optional(),
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
        // Bulan dalam angka 1-12 dikirim sebagai query string
        month: z
            .string()
            .regex(/^([1-9]|1[0-2])$/, 'Month must be a number between 1 and 12')
            .optional(),
        // Tahun dalam 4 digit angka, misal 2024
        year: z
            .string()
            .regex(/^\d{4}$/, 'Year must be a 4-digit number')
            .optional(),
    }),
});
