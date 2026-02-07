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

    async getAllBatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const batches = await inventoryService.getAllBatches();
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
}

export default new InventoryController();
