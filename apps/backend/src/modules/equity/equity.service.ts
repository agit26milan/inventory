import prisma from '../../database/client';
import { CreateEquityDTO, EquityResponse } from './equity.types';

export class EquityService {
    async createEquity(data: CreateEquityDTO): Promise<EquityResponse> {
        const equity = await prisma.equity.create({
            data: {
                amount: data.amount,
                description: data.description,
            },
        });

        return {
            id: equity.id,
            amount: Number(equity.amount),
            description: equity.description,
            createdAt: equity.createdAt,
        };
    }

    async getAllEquities(): Promise<EquityResponse[]> {
        const equities = await prisma.equity.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return equities.map(equity => ({
            id: equity.id,
            amount: Number(equity.amount),
            description: equity.description,
            createdAt: equity.createdAt,
        }));
    }

    async getTotalEquity(): Promise<number> {
        // Sum of all equity entries
        const equitySum = await prisma.equity.aggregate({
            _sum: {
                amount: true,
            },
        });

        // Sum of all non-deleted store expenses
        const expensesSum = await prisma.storeExpense.aggregate({
            where: {
                deletedAt: null,
            },
            _sum: {
                amount: true,
            },
        });

        const totalEquity = Number(equitySum._sum.amount || 0);
        const totalExpenses = Number(expensesSum._sum.amount || 0);

        return totalEquity - totalExpenses;
    }
}

export const equityService = new EquityService();
