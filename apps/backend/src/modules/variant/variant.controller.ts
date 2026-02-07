import { Request, Response, NextFunction } from 'express';
import variantService from './variant.service';
import { successResponse } from '../../utils/response';

export class VariantController {
    async createVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variant = await variantService.createVariant(req.body);
            successResponse(res, variant, 'Variant created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getVariantsByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variants = await variantService.getVariantsByProductId(Number(req.params.productId));
            successResponse(res, variants, 'Variants retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getVariantById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variant = await variantService.getVariantById(Number(req.params.id));
            successResponse(res, variant, 'Variant retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variant = await variantService.updateVariant(Number(req.params.id), req.body);
            successResponse(res, variant, 'Variant updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await variantService.deleteVariant(Number(req.params.id));
            successResponse(res, result, 'Variant deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // Variant Value endpoints
    async createVariantValue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variantValue = await variantService.createVariantValue(
                Number(req.params.variantId),
                req.body
            );
            successResponse(res, variantValue, 'Variant value created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateVariantValue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const variantValue = await variantService.updateVariantValue(
                Number(req.params.id),
                req.body
            );
            successResponse(res, variantValue, 'Variant value updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteVariantValue(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await variantService.deleteVariantValue(Number(req.params.id));
            successResponse(res, result, 'Variant value deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new VariantController();
