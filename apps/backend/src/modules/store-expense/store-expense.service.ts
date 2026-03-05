import prisma from '../../database/client';
import { CreateStoreExpenseDTO, UpdateStoreExpenseDTO, StoreExpenseResponse } from './store-expense.types';
import { AppError } from '../../utils/error-handler';

export class StoreExpenseService {
    async createExpense(data: CreateStoreExpenseDTO): Promise<StoreExpenseResponse> {
        const expense = await prisma.storeExpense.create({
            data: {
                amount: data.amount,
                description: data.description,
                category: data.category,
            },
        });

        return {
            id: expense.id,
            amount: Number(expense.amount),
            description: expense.description,
            category: expense.category || undefined,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
        };
    }

    async getAllExpenses(month?: number, year?: number): Promise<StoreExpenseResponse[]> {
        // Buat filter tanggal jika bulan dan tahun disediakan
        let dateFilter = {};
        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1); // Awal bulan berikutnya (eksklusif)
            dateFilter = {
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                },
            };
        }

        const expenses = await prisma.storeExpense.findMany({
            where: {
                deletedAt: null, // Hanya pengeluaran yang belum dihapus
                ...dateFilter,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return expenses.map(expense => ({
            id: expense.id,
            amount: Number(expense.amount),
            description: expense.description,
            category: expense.category || undefined,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
        }));
    }

    async updateExpense(id: number, data: UpdateStoreExpenseDTO): Promise<StoreExpenseResponse> {
        // Check if expense exists and is not deleted
        const existing = await prisma.storeExpense.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!existing) {
            throw new AppError(404, 'Store expense not found or has been deleted');
        }

        const expense = await prisma.storeExpense.update({
            where: { id },
            data: {
                amount: data.amount,
                description: data.description,
                category: data.category,
            },
        });

        return {
            id: expense.id,
            amount: Number(expense.amount),
            description: expense.description,
            category: expense.category || undefined,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
        };
    }

    async deleteExpense(id: number): Promise<void> {
        // Check if expense exists and is not already deleted
        const existing = await prisma.storeExpense.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        if (!existing) {
            throw new AppError(404, 'Store expense not found or has already been deleted');
        }

        // Soft delete
        await prisma.storeExpense.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    async getTotalExpenses(): Promise<number> {
        const result = await prisma.storeExpense.aggregate({
            where: {
                deletedAt: null,
            },
            _sum: {
                amount: true,
            },
        });

        return Number(result._sum.amount || 0);
    }
}

export const storeExpenseService = new StoreExpenseService();
