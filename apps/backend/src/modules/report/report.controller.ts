import { Request, Response, NextFunction } from 'express';
import reportService from './report.service';
import configurationService from '../configuration/configuration.service';
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

    async getStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            let threshold: number;

            // Jika threshold dari query param tersedia, gunakan itu
            if (req.query['threshold']) {
                threshold = parseInt(req.query['threshold'] as string, 10);
            } else {
                // Fallback: baca dari tabel konfigurasi, default 5
                const config = await configurationService.getByKey('stock_alert_threshold');
                threshold = config ? parseInt(config.value, 10) : 5;
            }

            // Parse pagination & search params
            const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1;
            const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 10;
            const search = req.query['search'] ? (req.query['search'] as string) : undefined;

            const alerts = await reportService.getStockAlerts(threshold, page, limit, search);
            successResponse(res, alerts, 'Stock alerts retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
    async getVariantPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page = req.query['page'] ? parseInt(req.query['page'] as string, 10) : 1;
            const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 10;

            const performance = await reportService.getVariantPerformance(page, limit);
            successResponse(res, performance, 'Variant performance retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new ReportController();
