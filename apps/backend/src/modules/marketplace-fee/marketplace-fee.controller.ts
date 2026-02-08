import { Request, Response, NextFunction } from 'express';
import { MarketplaceFeeService } from './marketplace-fee.service';

const feeService = new MarketplaceFeeService();

export const setFee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fee = await feeService.setFee(req.body);
        res.status(200).json({
            success: true,
            message: 'Marketplace fee set successfully',
            data: fee,
        });
    } catch (error) {
        next(error);
    }
};

export const getFeesByProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const productId = parseInt(req.params.productId as string);
        const fees = await feeService.getFeesByProduct(productId);
        res.status(200).json({
            success: true,
            message: 'Marketplace fees retrieved successfully',
            data: fees,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteFee = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id as string);
        await feeService.deleteFee(id);
        res.status(200).json({
            success: true,
            message: 'Marketplace fee deleted successfully',
            data: null,
        });
    } catch (error) {
        next(error);
    }
};
