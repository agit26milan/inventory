import { Request, Response, NextFunction } from 'express';
import variantCombinationService from './variant-combination.service';
import { successResponse } from '../../utils/response';

export class VariantCombinationController {
    async createVariantCombination(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const combination = await variantCombinationService.createVariantCombination(req.body);
            successResponse(res, combination, 'Variant combination created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getVariantCombinationsByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const combinations = await variantCombinationService.getVariantCombinationsByProductId(
                Number(req.params.productId)
            );
            successResponse(res, combinations, 'Variant combinations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getVariantCombinationById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const combination = await variantCombinationService.getVariantCombinationById(
                Number(req.params.id)
            );
            successResponse(res, combination, 'Variant combination retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateVariantCombination(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const combination = await variantCombinationService.updateVariantCombination(
                Number(req.params.id),
                req.body
            );
            successResponse(res, combination, 'Variant combination updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteVariantCombination(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await variantCombinationService.deleteVariantCombination(
                Number(req.params.id)
            );
            successResponse(res, result, 'Variant combination deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new VariantCombinationController();
