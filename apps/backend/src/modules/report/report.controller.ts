import { Request, Response, NextFunction } from 'express';
import reportService from './report.service';
import { successResponse } from '../../utils/response';

export class ReportController {
    async getSalesSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { startDate, endDate } = req.query;

            const start = startDate ? new Date(startDate as string) : undefined;
            const end = endDate ? new Date(endDate as string) : undefined;

            const summary = await reportService.getSalesSummary(start, end);
            successResponse(res, summary, 'Sales summary retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getProductPerformance(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const performance = await reportService.getProductPerformance();
            successResponse(
                res,
                performance,
                'Product performance retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getInventoryValuation(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const valuation = await reportService.getInventoryValuation();
            successResponse(
                res,
                valuation,
                'Inventory valuation retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }
}

export default new ReportController();
