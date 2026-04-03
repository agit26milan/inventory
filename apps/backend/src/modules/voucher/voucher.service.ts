import prisma from '../../database/client';
import { AppError } from '../../utils/error-handler';
import { CreateVoucherDTO, UpdateVoucherDTO, VoucherResponse } from './voucher.types';

export class VoucherService {
    
    /**
     * Parsing BigInt ID dan Decimal value agar compatible dengan JSON Response
     */
    private formatResponse(voucher: any): VoucherResponse {
        return {
            id: voucher.id.toString(),
            code: voucher.code,
            name: voucher.name,
            discountType: voucher.discountType,
            discountValue: Number(voucher.discountValue),
            startDate: voucher.startDate,
            endDate: voucher.endDate,
            isActive: voucher.isActive,
            createdAt: voucher.createdAt,
            updatedAt: voucher.updatedAt,
        };
    }

    async createVoucher(data: CreateVoucherDTO): Promise<VoucherResponse> {
        // Cek apakah kode voucher sudah ada
        const existingVoucher = await prisma.voucher.findUnique({
            where: { code: data.code.toUpperCase() }
        });

        if (existingVoucher) {
            throw new AppError(400, 'Kode voucher sudah digunakan');
        }

        const newVoucher = await prisma.voucher.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                discountType: data.discountType,
                discountValue: data.discountValue,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                isActive: data.isActive ?? true,
            }
        });

        return this.formatResponse(newVoucher);
    }

    async getAllVouchers(): Promise<VoucherResponse[]> {
        const vouchers = await prisma.voucher.findMany({
            orderBy: { createdAt: 'desc' }
        });
        
        return vouchers.map(this.formatResponse);
    }

    async getVoucherById(id: bigint): Promise<VoucherResponse> {
        const voucher = await prisma.voucher.findUnique({
            where: { id }
        });

        if (!voucher) {
            throw new AppError(404, 'Voucher tidak ditemukan');
        }

        return this.formatResponse(voucher);
    }

    async updateVoucher(id: bigint, data: UpdateVoucherDTO): Promise<VoucherResponse> {
        const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
        if (!existingVoucher) {
            throw new AppError(404, 'Voucher tidak ditemukan');
        }

        // Jika mengubah kode, pastikan kode baru tidak bentrok dengan ID lain
        if (data.code && data.code.toUpperCase() !== existingVoucher.code) {
            const codeConflict = await prisma.voucher.findUnique({
                where: { code: data.code.toUpperCase() }
            });

            if (codeConflict) {
                throw new AppError(400, 'Kode voucher sudah digunakan oleh voucher lain');
            }
        }

        const updateData: any = { ...data };
        if (data.code) updateData.code = data.code.toUpperCase();
        if (data.startDate) updateData.startDate = new Date(data.startDate);
        if (data.endDate) updateData.endDate = new Date(data.endDate);

        const updatedVoucher = await prisma.voucher.update({
            where: { id },
            data: updateData
        });

        return this.formatResponse(updatedVoucher);
    }

    async deleteVoucher(id: bigint): Promise<void> {
        const existingVoucher = await prisma.voucher.findUnique({ where: { id } });
        if (!existingVoucher) {
            throw new AppError(404, 'Voucher tidak ditemukan');
        }

        await prisma.voucher.delete({
            where: { id }
        });
    }
}

export const voucherService = new VoucherService();
