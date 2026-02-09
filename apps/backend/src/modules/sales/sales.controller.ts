import { Request, Response, NextFunction } from 'express';
import salesService from './sales.service';
import { successResponse } from '../../utils/response';

export class SalesController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sale = await salesService.createSale(req.body);
            successResponse(res, sale, 'Sale created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const filters = {
                productName: req.query.productName as string | undefined,
                variantName: req.query.variantName as string | undefined,
            };
            const sales = await salesService.getAllSales(filters);
            successResponse(res, sales, 'Sales retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const sale = await salesService.getSaleById(Number(req.params.id));
            successResponse(res, sale, 'Sale retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new SalesController();
