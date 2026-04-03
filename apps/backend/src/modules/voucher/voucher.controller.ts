import { Request, Response, NextFunction } from 'express';
import { voucherService } from './voucher.service';
import { successResponse } from '../../utils/response';
import { CreateVoucherDTO, UpdateVoucherDTO } from './voucher.types';

export class VoucherController {
    
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data: CreateVoucherDTO = req.body;
            const voucher = await voucherService.createVoucher(data);
            successResponse(res, voucher, 'Voucher berhasil dibuat', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAll(_req: Request, res: Response, next: NextFunction) {
        try {
            const vouchers = await voucherService.getAllVouchers();
            successResponse(res, vouchers, 'Data voucher berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = BigInt(req.params.id as string);
            const voucher = await voucherService.getVoucherById(id);
            successResponse(res, voucher, 'Data voucher berhasil diambil');
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = BigInt(req.params.id as string);
            const data: UpdateVoucherDTO = req.body;
            const updatedVoucher = await voucherService.updateVoucher(id, data);
            successResponse(res, updatedVoucher, 'Voucher berhasil diperbarui');
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = BigInt(req.params.id as string);
            await voucherService.deleteVoucher(id);
            successResponse(res, null, 'Voucher berhasil dihapus');
        } catch (error) {
            next(error);
        }
    }
}

export default new VoucherController();
