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

export const getAllEquities = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const equities = await equityService.getAllEquities();
        successResponse(res, equities, 'Equities retrieved successfully');
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
