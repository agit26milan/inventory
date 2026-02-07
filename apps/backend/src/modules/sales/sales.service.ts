import prisma from '../../database/client';
import { CreateSaleDTO, SaleResponse } from './sales.types';
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

            // Process each item in the sale
            for (const item of data.items) {
                // Get product details
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new AppError(404, `Product with ID ${item.productId} not found`);
                }

                // Check available stock
                const currentStock = await this.getAvailableStock(tx, item.productId);
                if (currentStock < item.quantity) {
                    throw new AppError(
                        400,
                        `Insufficient stock for product "${product.name}". Available: ${currentStock}, Requested: ${item.quantity}`
                    );
                }

                // Calculate COGS based on FIFO or LIFO
                const cogs = await this.calculateCogsAndDeductStock(
                    tx,
                    item.productId,
                    item.quantity,
                    product.stockMethod
                );

                const itemTotal = Number(product.sellingPrice) * item.quantity;
                totalAmount += itemTotal;
                totalCogs += cogs;

                saleItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    sellingPrice: product.sellingPrice,
                    cogs,
                });
            }

            const profit = totalAmount - totalCogs;

            // Create the sale record
            const sale = await tx.sale.create({
                data: {
                    totalAmount,
                    totalCogs,
                    profit,
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
                        },
                    },
                },
            });

            return {
                id: sale.id,
                saleDate: sale.saleDate,
                totalAmount: Number(sale.totalAmount),
                totalCogs: Number(sale.totalCogs),
                profit: Number(sale.profit),
                items: sale.saleItems.map((item) => ({
                    id: item.id,
                    productId: item.productId,
                    productName: item.product.name,
                    quantity: item.quantity,
                    sellingPrice: Number(item.sellingPrice),
                    cogs: Number(item.cogs),
                    profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
                })),
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
        stockMethod: StockMethod
    ): Promise<number> {
        let remainingQuantity = quantity;
        let totalCogs = 0;

        // Fetch inventory batches based on stock method
        const orderBy = stockMethod === 'FIFO' ? 'asc' : 'desc';
        const batches = await tx.inventoryBatch.findMany({
            where: {
                productId,
                remainingQuantity: {
                    gt: 0,
                },
            },
            orderBy: {
                createdAt: orderBy,
            },
        });

        // Deduct from batches sequentially
        for (const batch of batches) {
            if (remainingQuantity <= 0) break;

            const deductQuantity = Math.min(batch.remainingQuantity, remainingQuantity);
            const batchCogs = Number(batch.costPrice) * deductQuantity;

            totalCogs += batchCogs;
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

        return totalCogs;
    }

    /**
     * Get available stock for a product
     */
    private async getAvailableStock(tx: any, productId: number): Promise<number> {
        const batches = await tx.inventoryBatch.findMany({
            where: { productId },
            select: {
                remainingQuantity: true,
            },
        });

        return batches.reduce((sum: number, batch: any) => sum + batch.remainingQuantity, 0);
    }

    /**
     * Get all sales
     */
    async getAllSales(): Promise<SaleResponse[]> {
        const sales = await prisma.sale.findMany({
            include: {
                saleItems: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                saleDate: 'desc',
            },
        });

        return sales.map((sale) => ({
            id: sale.id,
            saleDate: sale.saleDate,
            totalAmount: Number(sale.totalAmount),
            totalCogs: Number(sale.totalCogs),
            profit: Number(sale.profit),
            items: sale.saleItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                sellingPrice: Number(item.sellingPrice),
                cogs: Number(item.cogs),
                profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
            })),
        }));
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
            items: sale.saleItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                sellingPrice: Number(item.sellingPrice),
                cogs: Number(item.cogs),
                profit: Number(item.sellingPrice) * item.quantity - Number(item.cogs),
            })),
        };
    }
}

export default new SalesService();
