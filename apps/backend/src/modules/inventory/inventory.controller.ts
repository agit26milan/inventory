import { Request, Response, NextFunction } from 'express';
import inventoryService from './inventory.service';
import { successResponse } from '../../utils/response';

export class InventoryController {
    async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batch = await inventoryService.createBatch(req.body);
            successResponse(res, batch, 'Inventory batch created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getBatchesByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batches = await inventoryService.getBatchesByProduct(
                Number(req.params.productId)
            );
            successResponse(res, batches, 'Inventory batches retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllBatches(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                productName: req.query.productName as string | undefined,
                variantName: req.query.variantName as string | undefined,
            };
            const batches = await inventoryService.getAllBatches(filters);
            successResponse(res, batches, 'All inventory batches retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentStock(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const stock = await inventoryService.getCurrentStock(
                Number(req.params.productId)
            );
            successResponse(
                res,
                { productId: Number(req.params.productId), currentStock: stock },
                'Current stock retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async updateBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batch = await inventoryService.updateBatch(
                Number(req.params.id),
                req.body
            );
            successResponse(res, batch, 'Inventory batch updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async bulkUpdateSellingPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await inventoryService.bulkUpdateSellingPrice(req.body);
            successResponse(res, null, 'Inventory selling prices updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getBatchById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batch = await inventoryService.getBatchById(Number(req.params.id));
            successResponse(res, batch, 'Inventory batch details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await inventoryService.deleteBatch(Number(req.params.id));
            successResponse(res, result, 'Inventory batch deleted successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new InventoryController();
