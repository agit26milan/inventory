import { z } from 'zod';

export const createVoucherSchema = z.object({
    body: z.object({
        code: z.string().min(3, 'Kode voucher minimal 3 karakter').max(50, 'Kode voucher maksimal 50 karakter'),
        name: z.string().min(3, 'Nama voucher minimal 3 karakter').max(150, 'Nama voucher maksimal 150 karakter'),
        discountType: z.enum(['NOMINAL', 'PERCENTAGE']),
        discountValue: z.number().positive('Nilai diskon harus bilangan positif'),
        startDate: z.string().datetime({ message: 'Format startDate harus ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)' }),
        endDate: z.string().datetime({ message: 'Format endDate harus ISO 8601 (YYYY-MM-DDTHH:MM:SSZ)' }),
        isActive: z.boolean().optional().default(true),
    }).refine((data) => {
        if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
            return false;
        }
        return true;
    }, { message: 'Persentase diskon tidak boleh melebihi 100', path: ['discountValue'] })
      .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
          message: 'Tanggal berakhir harus lebih dari tanggal mulai',
          path: ['endDate'],
      }),
});

export const updateVoucherSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid voucher ID'),
    }),
    body: z.object({
        code: z.string().min(3).max(50).optional(),
        name: z.string().min(3).max(150).optional(),
        discountType: z.enum(['NOMINAL', 'PERCENTAGE']).optional(),
        discountValue: z.number().positive().optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        isActive: z.boolean().optional(),
    }).refine((data) => {
        if (data.discountType === 'PERCENTAGE' && data.discountValue !== undefined && data.discountValue > 100) {
            return false;
        }
        return true;
    }, { message: 'Persentase diskon tidak boleh melebihi 100', path: ['discountValue'] }),
});

export const getOrDeleteVoucherSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid voucher ID'),
    }),
});
