import prisma from '../../database/client';
import {
    SalesSummaryReport,
    ProductPerformanceReport,
    InventoryValuationReport,
    StockAlertReport,
    PaginatedStockAlerts,
    VariantPerformanceReport,
    PaginatedVariantPerformance,
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
    /**
     * Get stock alerts — variant combinations with stock below the threshold.
     * Mengembalikan daftar kombinasi variant yang stoknya kurang dari batas minimum,
     * berdasarkan akumulasi remainingQuantity dari inventoryBatches.
     * Mendukung pencarian (search) dan pagination.
     */
    async getStockAlerts(
        threshold: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedStockAlerts> {
        // Query dasar mengambil seluruh data yang relevan (karena kalkulasi dilakukan di memory)
        const combinations = await prisma.variantCombination.findMany({
            include: {
                product: {
                    select: { id: true, name: true },
                },
                values: {
                    include: {
                        variantValue: {
                            select: { name: true },
                        },
                    },
                },
                inventoryBatches: {
                    where: {
                        remainingQuantity: { gt: 0 },
                    },
                    select: {
                        remainingQuantity: true,
                    },
                },
            },
        });

        const searchLower = search ? search.toLowerCase() : '';

        // Transformasi dan Kalkulasi Stok
        let alerts: StockAlertReport[] = combinations.map((combo) => {
            const variantName =
                combo.values.map((v) => v.variantValue.name).join(' / ') || combo.sku;

            const currentStock = combo.inventoryBatches.reduce(
                (sum, batch) => sum + batch.remainingQuantity,
                0
            );

            return {
                productId: combo.product.id,
                productName: combo.product.name,
                combinationId: combo.id,
                variantName,
                sku: combo.sku,
                currentStock,
                threshold,
            };
        });

        // Filter 1: Cek threshold stok
        alerts = alerts.filter((alert) => alert.currentStock < threshold);

        // Filter 2: Pencarian text
        if (searchLower) {
            alerts = alerts.filter(
                (alert) =>
                    alert.productName.toLowerCase().includes(searchLower) ||
                    alert.variantName.toLowerCase().includes(searchLower) ||
                    alert.sku.toLowerCase().includes(searchLower)
            );
        }

        // Urutkan default dari stok paling sedikit
        alerts.sort((a, b) => a.currentStock - b.currentStock);

        // Pagination metadata
        const total = alerts.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Potong array berdasarkan page & limit
        const paginatedData = alerts.slice(offset, offset + limit);

        return {
            data: paginatedData,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }

    /**
     * Get variant performance report - Total Penjualan per Variant
     * Mengembalikan metrik penjualan yang dikelompokkan berdasarkan varian
     */
    async getVariantPerformance(
        page: number = 1,
        limit: number = 10
    ): Promise<PaginatedVariantPerformance> {
        const saleItems = await prisma.saleItem.findMany({
            include: {
                product: {
                    select: { id: true, name: true },
                },
                variantCombination: {
                    include: {
                        values: {
                            include: {
                                variantValue: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        const variantMap = new Map<string, VariantPerformanceReport>();

        for (const item of saleItems) {
            // Group key per product + variant combination
            const key = `${item.productId}-${item.variantCombinationId || 'null'}`;
            const revenue = Number(item.sellingPrice) * item.quantity;
            const cogs = Number(item.cogs);
            const profit = revenue - cogs;

            if (variantMap.has(key)) {
                const existing = variantMap.get(key)!;
                existing.totalQuantitySold += item.quantity;
                existing.totalRevenue += revenue;
                existing.totalCogs += cogs;
                existing.totalProfit += profit;
            } else {
                let variantName = '-';
                let sku = '-';

                if (item.variantCombination) {
                    variantName =
                        item.variantCombination.values
                            .map((v) => v.variantValue.name)
                            .join(' / ') || item.variantCombination.sku;
                    sku = item.variantCombination.sku;
                }

                variantMap.set(key, {
                    productId: item.productId,
                    productName: item.product.name,
                    combinationId: item.variantCombinationId,
                    variantName,
                    sku,
                    totalQuantitySold: item.quantity,
                    totalRevenue: revenue,
                    totalCogs: cogs,
                    totalProfit: profit,
                });
            }
        }

        // Urutkan berdasarkan qty terjual terbanyak (tertinggi pertama)
        const allData = Array.from(variantMap.values()).sort(
            (a, b) => b.totalQuantitySold - a.totalQuantitySold
        );

        // Pagination
        const total = allData.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        const paginatedData = allData.slice(offset, offset + limit);

        return {
            data: paginatedData,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
}

export default new ReportService();
