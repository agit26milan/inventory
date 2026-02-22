import { Request, Response, NextFunction } from 'express';
import { storeExpenseService } from './store-expense.service';
import { successResponse } from '../../utils/response';

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const expense = await storeExpenseService.createExpense(req.body);
        successResponse(res, expense, 'Store expense created successfully', 201);
    } catch (error) {
        next(error);
    }
};

export const getAllExpenses = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const expenses = await storeExpenseService.getAllExpenses();
        successResponse(res, expenses, 'Store expenses retrieved successfully');
    } catch (error) {
        next(error);
    }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id as string);
        const expense = await storeExpenseService.updateExpense(id, req.body);
        successResponse(res, expense, 'Store expense updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id as string);
        await storeExpenseService.deleteExpense(id);
        successResponse(res, null, 'Store expense deleted successfully');
    } catch (error) {
        next(error);
    }
};

export const getTotalExpenses = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const total = await storeExpenseService.getTotalExpenses();
        successResponse(res, { total }, 'Total expenses calculated successfully');
    } catch (error) {
        next(error);
    }
};
