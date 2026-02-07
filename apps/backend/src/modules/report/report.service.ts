import prisma from '../../database/client';
import {
    SalesSummaryReport,
    ProductPerformanceReport,
    InventoryValuationReport,
} from './report.types';

export class ReportService {
    /**
     * Get sales summary report
     */
    async getSalesSummary(
        startDate?: Date,
        endDate?: Date
    ): Promise<SalesSummaryReport> {
        const whereClause: any = {};

        if (startDate || endDate) {
            whereClause.saleDate = {};
            if (startDate) whereClause.saleDate.gte = startDate;
            if (endDate) whereClause.saleDate.lte = endDate;
        }

        const sales = await prisma.sale.findMany({
            where: whereClause,
            select: {
                totalAmount: true,
                totalCogs: true,
                profit: true,
            },
        });

        const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
        const totalCogs = sales.reduce((sum, sale) => sum + Number(sale.totalCogs), 0);
        const totalProfit = sales.reduce((sum, sale) => sum + Number(sale.profit), 0);
        const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

        return {
            totalSales,
            totalCogs,
            totalProfit,
            profitMargin: Number(profitMargin.toFixed(2)),
            numberOfTransactions: sales.length,
        };
    }

    /**
     * Get product performance report
     */
    async getProductPerformance(): Promise<ProductPerformanceReport[]> {
        const saleItems = await prisma.saleItem.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Group by product
        const productMap = new Map<number, ProductPerformanceReport>();

        for (const item of saleItems) {
            const productId = item.productId;
            const revenue = Number(item.sellingPrice) * item.quantity;
            const cogs = Number(item.cogs);
            const profit = revenue - cogs;

            if (productMap.has(productId)) {
                const existing = productMap.get(productId)!;
                existing.totalQuantitySold += item.quantity;
                existing.totalRevenue += revenue;
                existing.totalCogs += cogs;
                existing.totalProfit += profit;
            } else {
                productMap.set(productId, {
                    productId,
                    productName: item.product.name,
                    totalQuantitySold: item.quantity,
                    totalRevenue: revenue,
                    totalCogs: cogs,
                    totalProfit: profit,
                });
            }
        }

        return Array.from(productMap.values()).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
        );
    }

    /**
     * Get inventory valuation report
     */
    async getInventoryValuation(): Promise<InventoryValuationReport[]> {
        const products = await prisma.product.findMany({
            include: {
                inventoryBatches: {
                    where: {
                        remainingQuantity: {
                            gt: 0,
                        },
                    },
                    select: {
                        remainingQuantity: true,
                        costPrice: true,
                    },
                },
            },
        });

        return products
            .map((product) => {
                const currentStock = product.inventoryBatches.reduce(
                    (sum, batch) => sum + batch.remainingQuantity,
                    0
                );

                if (currentStock === 0) {
                    return null;
                }

                const totalValue = product.inventoryBatches.reduce(
                    (sum, batch) => sum + batch.remainingQuantity * Number(batch.costPrice),
                    0
                );

                const averageCostPrice = totalValue / currentStock;

                return {
                    productId: product.id,
                    productName: product.name,
                    currentStock,
                    averageCostPrice: Number(averageCostPrice.toFixed(2)),
                    totalValue: Number(totalValue.toFixed(2)),
                };
            })
            .filter((item): item is InventoryValuationReport => item !== null)
            .sort((a, b) => b.totalValue - a.totalValue);
    }
}

export default new ReportService();
