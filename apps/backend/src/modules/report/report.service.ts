import prisma from '../../database/client';
import {
    SalesSummaryReport,
    ProductPerformanceReport,
    InventoryValuationReport,
    StockAlertReport,
    PaginatedStockAlerts,
    VariantPerformanceReport,
    PaginatedVariantPerformance,
    PaginatedSalesTimeframe,
    AnnualSalesDataPoint,
    PaginatedAnnualSales
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

    /**
     * Get Sales Timeframe Report - Penjualan dalam 1 Hari, 7 Hari, 30 Hari per produk
     */
    async getSalesTimeframe(
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedSalesTimeframe> {
        // Build product criteria
        const productWhere: any = {};
        if (search) {
            productWhere.name = { contains: search };
        }

        // Hitung total products untuk pagination
        const total = await prisma.product.count({ where: productWhere });
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // Ambil produk halaman ini
        const products = await prisma.product.findMany({
            where: productWhere,
            skip: offset,
            take: limit,
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        if (products.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages },
            };
        }

        const productIds = products.map((p) => p.id);

        // Ambil sale items 30 hari terakhir untuk produk-produk ini
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const saleItems = await prisma.saleItem.findMany({
            where: {
                productId: { in: productIds },
                sale: {
                    createdAt: { gte: thirtyDaysAgo },
                },
            },
            include: {
                sale: {
                    select: { createdAt: true },
                },
            },
        });

        // Grouping sales berdasarkan ID Produk dan Waktu
        const results = products.map((product) => {
            const itemsForProduct = saleItems.filter((item) => item.productId === product.id);

            let sold1Day = 0;
            let sold7Days = 0;
            let sold30Days = 0;

            for (const item of itemsForProduct) {
                const saleDate = item.sale?.createdAt;
                if (!saleDate) continue;

                const qty = item.quantity;
                sold30Days += qty;

                if (saleDate >= sevenDaysAgo) {
                    sold7Days += qty;
                }

                if (saleDate >= oneDayAgo) {
                    sold1Day += qty;
                }
            }

            return {
                productId: product.id,
                productName: product.name,
                sold1Day,
                sold7Days,
                sold30Days,
            };
        });

        return {
            data: results,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }

    async getAnnualSales(
        year: number,
        month?: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<PaginatedAnnualSales> {
        const offset = (page - 1) * limit;

        // Base query for products (similar to other reports)
        const productWhere: any = {};
        if (search) {
            productWhere.name = {
                contains: search,
            };
        }

        // Hitung total data product untuk pagination
        const total = await prisma.product.count({ where: productWhere });
        const totalPages = Math.ceil(total / limit);

        // Ambil produk halaman ini
        const products = await prisma.product.findMany({
            where: productWhere,
            skip: offset,
            take: limit,
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        if (products.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages },
            };
        }

        const productIds = products.map((p) => p.id);

        // Date range based on year and optional month
        let startDate: Date;
        let endDate: Date;

        if (month !== undefined && month >= 1 && month <= 12) {
            // Specific month
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0, 23, 59, 59, 999);
        } else {
            // Full calendar year
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        }

        // Ambil sale items untuk produk-produk ini dalam rentang waktu yang ditentukan
        const saleItems = await prisma.saleItem.findMany({
            where: {
                productId: { in: productIds },
                sale: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            },
            include: {
                sale: {
                    select: { createdAt: true },
                },
            },
        });

        // Grouping sales berdasarkan ID Produk dan Bulan (1-12)
        const results = products.map((product) => {
            const itemsForProduct = saleItems.filter((item) => item.productId === product.id);

            // Inisialisasi array 12 bulan (index 0 = Jan, 11 = Dec)
            // Jika filter month aktif, kita tetap bisa merender array 12 bulan yg kosong selain bulan tsb,
            // atau menyesuaikan UI. Disini kembalikan 12 bulan penuh selalu untuk konsistensi Chart. 
            const monthlyData: AnnualSalesDataPoint[] = Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                totalQuantity: 0,
                totalRevenue: 0,
            }));

            let totalYearQuantity = 0;
            let totalYearRevenue = 0;

            for (const item of itemsForProduct) {
                const saleDate = item.sale?.createdAt;
                if (!saleDate) continue;

                // getMonth() returns 0-11
                const itemMonth = saleDate.getMonth();
                
                const qty = item.quantity;
                const revenue = Number(item.sellingPrice) * qty;

                monthlyData[itemMonth].totalQuantity += qty;
                monthlyData[itemMonth].totalRevenue += revenue;
                
                totalYearQuantity += qty;
                totalYearRevenue += revenue;
            }

            return {
                productId: product.id,
                productName: product.name,
                totalYearQuantity,
                totalYearRevenue,
                monthlyData,
            };
        });

        return {
            data: results,
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
