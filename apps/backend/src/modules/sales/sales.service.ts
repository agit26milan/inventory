import prisma from '../../database/client';
import { CreateSaleDTO, SaleResponse, PaginatedSales, GetSalesFilters } from './sales.types';
import { AppError } from '../../utils/error-handler';
import { StockMethod } from '@prisma/client';

export class SalesService {
    /**
     * Create a new sale transaction with automatic FIFO/LIFO stock deduction
     */
    async createSale(data: CreateSaleDTO): Promise<SaleResponse> {
        // Use transaction to ensure data consistency
        return await prisma.$transaction(async (tx) => {
            let totalAmount = 0;
            let totalCogs = 0;
            const saleItemsData = [];

            let isProcessFeeApplied = false;

            // Process each item in the sale
            for (const item of data.items) {
                // Get product details
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    include: {
                        marketplaceFees: true, // Fetch fees
                    }
                });

                if (!product) {
                    throw new AppError(404, `Product with ID ${item.productId} not found`);
                }

                // Verify variant combination if provided
                if (item.variantCombinationId) {
                    const variant = await tx.variantCombination.findUnique({
                        where: { id: item.variantCombinationId },
                    });
                     if (!variant) {
                         throw new AppError(404, `Variant combination ID ${item.variantCombinationId} not found`);
                     }
                     if (variant.productId !== item.productId) {
                         throw new AppError(400, `Variant combination ID ${item.variantCombinationId} does not belong to product ${item.productId}`);
                     }
                }

                // Check available stock
                const currentStock = await this.getAvailableStock(tx, item.productId, item.variantCombinationId);
                if (currentStock < item.quantity) {
                    throw new AppError(
                        400,
                        `Insufficient stock for product "${product.name}". Available: ${currentStock}, Requested: ${item.quantity}`
                    );
                }

                // Calculate COGS and Revenue based on FIFO or LIFO
                const { cogs, revenue } = await this.calculateCogsAndDeductStock(
                    tx,
                    item.productId,
                    item.quantity,
                    product.stockMethod,
                    item.variantCombinationId
                );

                // Calculate Fee Deduction (if applicable)
                const shopeeFee = product.marketplaceFees.find(f => f.marketplace === 'SHOPEE');
                let netRevenue = revenue;
                
                if (shopeeFee) {
                    // We reduce the revenue (total selling price) by the fee percentage
                    const feeAmount = (revenue * Number(shopeeFee.percentage)) / 100;
                    netRevenue = revenue - feeAmount;

                    // Apply process fee only once per Sale transaction
                    if (!isProcessFeeApplied) {
                        const processFeeAmount = Number(shopeeFee.processFee);
                        netRevenue -= processFeeAmount;
                        isProcessFeeApplied = true;
                    }
                }

                totalAmount += netRevenue;
                totalCogs += cogs;

                // Calculate weighted average selling price for the sale item record (NET Price)
                const averageSellingPrice = netRevenue / item.quantity;
                
                saleItemsData.push({
                    productId: item.productId,
                    variantCombinationId: item.variantCombinationId,
                    quantity: item.quantity,
                    sellingPrice: averageSellingPrice,
                    cogs,
                });
            }

            // Profit adalah Total Net Revenue - Total COGS
            const profit = totalAmount - totalCogs;

            // =============================================
            // Logika penerapan diskon voucher (jika ada)
            // =============================================
            let voucherDiscount = 0;
            let appliedVoucherId: bigint | undefined = undefined;

            if (data.voucherId) {
                const voucher = await tx.voucher.findUnique({
                    where: { id: BigInt(data.voucherId) },
                });

                if (!voucher) {
                    throw new AppError(404, 'Voucher tidak ditemukan');
                }
                if (!voucher.isActive) {
                    throw new AppError(400, 'Voucher tidak aktif');
                }
                const now = new Date();
                if (now < voucher.startDate || now > voucher.endDate) {
                    throw new AppError(400, 'Voucher sudah tidak berlaku atau belum dimulai');
                }

                if (voucher.discountType === 'NOMINAL') {
                    // Diskon nominal langsung dikurangi dari total penjualan
                    voucherDiscount = Number(voucher.discountValue);
                } else {
                    // Diskon persentase: persentase x totalAmount (harga jual bersih)
                    voucherDiscount = (Number(voucher.discountValue) / 100) * totalAmount;
                }

                // Pastikan diskon tidak melebihi total harga
                voucherDiscount = Math.min(voucherDiscount, totalAmount);
                appliedVoucherId = voucher.id;
            }

            // Profit akhir setelah potongan voucher
            const finalProfit = profit - voucherDiscount;

            // Create the sale record
            const sale = await tx.sale.create({
                data: {
                    totalAmount,
                    totalCogs,
                    profit: finalProfit,
                    voucherId: appliedVoucherId,
                    voucherDiscount,
                    saleItems: {
                        create: saleItemsData,
                    },
                },
                include: {
                    saleItems: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                            variantCombination: {
                                select: {
                                    sku: true,
                                }
                            }
                        },
                    },
                    voucher: {
                        select: {
                            code: true,
                        }
                    },
                },
            });

            // Automatically create equity entry for the total revenue
            await tx.equity.create({
                data: {
                    amount: totalAmount,
                    description: `Revenue from Sale #${sale.id}`,
                },
            });

            return {
                id: sale.id,
                saleDate: sale.saleDate,
                totalAmount: Number(sale.totalAmount),
                totalCogs: Number(sale.totalCogs),
                profit: Number(sale.profit),
                voucherDiscount: Number(sale.voucherDiscount),
                voucherCode: sale.voucher?.code,
                items: sale.saleItems.map((item) => {
                    return {
                        id: item.id,
                        productId: item.productId,
                        productName: item.product.name,
                        variantName: item.variantCombination?.sku,
                        quantity: item.quantity,
                        sellingPrice: Number(item.sellingPrice),
                        cogs: Number(item.cogs),
                        profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
                    };
                }),
            };
        });
    }

    /**
     * Calculate COGS and deduct stock based on FIFO or LIFO method
     */
    private async calculateCogsAndDeductStock(
        tx: any,
        productId: number,
        quantity: number,
        stockMethod: StockMethod,
        variantCombinationId?: number
    ): Promise<{ cogs: number; revenue: number }> {
        let remainingQuantity = quantity;
        let totalCogs = 0;
        let totalRevenue = 0;

        // Fetch inventory batches based on stock method
        const orderBy = stockMethod === 'FIFO' ? 'asc' : 'desc';
        
        const whereClause: any = {
            productId,
            remainingQuantity: {
                gt: 0,
            },
        };

        if (variantCombinationId) {
            whereClause.variantCombinationId = variantCombinationId;
        }

        const batches = await tx.inventoryBatch.findMany({
            where: whereClause,
            orderBy: {
                createdAt: orderBy,
            },
        });

        // Deduct from batches sequentially
        for (const batch of batches) {
            if (remainingQuantity <= 0) break;

            const deductQuantity = Math.min(batch.remainingQuantity, remainingQuantity);
            const batchCogs = Number(batch.costPrice) * deductQuantity;
            const batchRevenue = Number(batch.sellingPrice) * deductQuantity;

            totalCogs += batchCogs;
            totalRevenue += batchRevenue;
            remainingQuantity -= deductQuantity;

            // Update batch remaining quantity
            await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: {
                    remainingQuantity: batch.remainingQuantity - deductQuantity,
                },
            });
        }

        if (remainingQuantity > 0) {
            throw new AppError(400, 'Insufficient stock to complete the sale');
        }

        return { cogs: totalCogs, revenue: totalRevenue };
    }

    /**
     * Get available stock for a product
     */
    private async getAvailableStock(tx: any, productId: number, variantCombinationId?: number): Promise<number> {
        const whereClause: any = { productId };
        if (variantCombinationId) {
             whereClause.variantCombinationId = variantCombinationId;
        }

        const batches = await tx.inventoryBatch.findMany({
            where: whereClause,
            select: {
                remainingQuantity: true,
            },
        });

        return batches.reduce((sum: number, batch: any) => sum + batch.remainingQuantity, 0);
    }

    /**
     * Get all sales
     */
    async getAllSales(filters?: GetSalesFilters): Promise<PaginatedSales> {
        const whereClause: Record<string, unknown> = {};
        
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        /**
         * Logika filter tanggal penjualan:
         * - month + year → range bulan spesifik pada tahun yang dipilih
         * - year saja    → range seluruh tahun (1 Jan – 31 Des)
         * - month saja   → range bulan pada tahun berjalan (fallback)
         */
        if (filters?.month || filters?.year) {
            const targetYear = filters.year ?? new Date().getFullYear();

            if (filters?.month) {
                // Filter bulan spesifik pada tahun target
                const startOfMonth = new Date(targetYear, filters.month - 1, 1);
                const endOfMonth = new Date(targetYear, filters.month, 0, 23, 59, 59, 999);
                whereClause.saleDate = { gte: startOfMonth, lte: endOfMonth };
            } else {
                // Filter seluruh tahun target
                const startOfYear = new Date(targetYear, 0, 1);
                const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
                whereClause.saleDate = { gte: startOfYear, lte: endOfYear };
            }
        }

        // Build where clause untuk filter berdasarkan item penjualan
        if (filters?.productName || filters?.variantName) {
            whereClause.saleItems = {
                some: {
                    ...(filters.productName && {
                        product: {
                            name: {
                                contains: filters.productName,
                            },
                        },
                    }),
                    ...(filters.variantName && {
                        variantCombination: {
                            sku: {
                                contains: filters.variantName,
                            },
                        },
                    }),
                },
            };
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where: whereClause,
                include: {
                    saleItems: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                },
                            },
                             variantCombination: {
                                 select: {
                                     sku: true,
                                 }
                             }
                        },
                    },
                    voucher: {
                        select: {
                            code: true,
                        }
                    },
                },
                orderBy: {
                    saleDate: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.sale.count({ where: whereClause }),
        ]);

        return {
            data: sales.map((sale) => ({
                id: sale.id,
                saleDate: sale.saleDate,
                totalAmount: Number(sale.totalAmount),
                totalCogs: Number(sale.totalCogs),
                profit: Number(sale.profit),
                voucherDiscount: Number(sale.voucherDiscount),
                voucherCode: (sale as any).voucher?.code,
                items: sale.saleItems.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product.name,
                    variantName: item.variantCombination?.sku,
                    quantity: item.quantity,
                    sellingPrice: Number(item.sellingPrice),
                    cogs: Number(item.cogs),
                    profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
                })),
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get sale by ID
     */
    async getSaleById(id: number): Promise<SaleResponse> {
        const sale = await prisma.sale.findUnique({
            where: { id },
            include: {
                saleItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                         variantCombination: {
                             select: {
                                 sku: true,
                             }
                         }
                    },
                },
            },
        });

        if (!sale) {
            throw new AppError(404, 'Sale not found');
        }

        return {
            id: sale.id,
            saleDate: sale.saleDate,
            totalAmount: Number(sale.totalAmount),
            totalCogs: Number(sale.totalCogs),
            profit: Number(sale.profit),
            voucherDiscount: Number(sale.voucherDiscount),
            voucherCode: (sale as any).voucher?.code,
            items: sale.saleItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                variantName: item.variantCombination?.sku,
                quantity: item.quantity,
                sellingPrice: Number(item.sellingPrice),
                cogs: Number(item.cogs),
                profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
            })),
        };
    }
}

export default new SalesService();
