import prisma from '../../database/client';
import { CreateEquityDTO, EquityResponse, PaginatedEquities } from './equity.types';

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

    async getAllEquities(
        page: number = 1,
        limit: number = 10,
        month?: number,
        year?: number
    ): Promise<PaginatedEquities> {
        const skip = (page - 1) * limit;

        // Build where clause
        const whereClause: any = {};
        if (month !== undefined && year !== undefined) {
            // JS months are 0-indexed, but input month is 1-12
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59, 999);
            whereClause.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        } else if (year !== undefined) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
            whereClause.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const [equities, total] = await Promise.all([
            prisma.equity.findMany({
                where: whereClause,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.equity.count({ where: whereClause }),
        ]);

        return {
            data: equities.map((equity) => ({
                id: equity.id,
                amount: Number(equity.amount),
                description: equity.description,
                createdAt: equity.createdAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getTotalEquity(): Promise<number> {
        // Sum of all equity entries
        const equitySum = await prisma.equity.aggregate({
            _sum: {
                amount: true,
            },
        });

        const totalEquity = Number(equitySum._sum.amount || 0);

        return totalEquity;
    }
}

export const equityService = new EquityService();
