import { Request, Response, NextFunction } from 'express';
import { equityService } from './equity.service';
import { successResponse } from '../../utils/response';

export const createEquity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const equity = await equityService.createEquity(req.body);
        successResponse(res, equity, 'Equity created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const getAllEquities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        let month: number | undefined = undefined;
        let year: number | undefined = undefined;

        if (req.query.month) {
            month = parseInt(req.query.month as string);
        }
        if (req.query.year) {
            year = parseInt(req.query.year as string);
        }

        const result = await equityService.getAllEquities(page, limit, month, year);
        // Using response structure expected by frontend (data.data as array, but now it's {data, meta})
        // successResponse sets result as `data`, so the clientside expects response.data.data
        // For PaginatedEquities, `result` has { data: [...], meta: {...} }
        successResponse(res, result, 'Equities retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const getTotalEquity = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const total = await equityService.getTotalEquity();
        successResponse(res, { total }, 'Total equity calculated successfully');
    } catch (error) {
        next(error);
    }
};
