import prisma from '../../database/client';
import { CreateSaleDTO, SaleResponse } from './sales.types';
import { AppError } from '../../utils/error-handler';
import { StockMethod } from '@prisma/client';
import { equityService } from '../equity/equity.service';

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
                    // "harga selling price ... akan di kurangi biaya admin"
                    // We reduce the revenue (total selling price) by the fee percentage
                    const feeAmount = (revenue * Number(shopeeFee.percentage)) / 100;
                    const processFeeAmount = Number(shopeeFee.processFee);
                    netRevenue = revenue - feeAmount - processFeeAmount;
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

            // Profit is now simply Total Net Revenue - Total COGS
            const profit = totalAmount - totalCogs;

            // Create the sale record
            // Note: `totalAmount` is Gross Revenue.
            // `totalCogs` is Cost of Goods.
            // `profit` is Net Profit (Revenue - COGS - Fees).
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
                             variantCombination: {
                                 select: {
                                     sku: true,
                                 }
                             }
                        },
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
                items: sale.saleItems.map((item) => {
                    // We need to re-calculate fee to show correct item profit in response, 
                    // OR we accept that this response might show Gross Profit for items if we don't fetch fees again.
                    // But we can't easily fetch fees here again efficiently without query.
                    // For the response, simpler is (sellingPrice * qty - cogs).
                    // If we want to show net profit per item, we'd need to know the fee again.
                    // Let's stick to simple Gross Profit for item breakdown unless we query product again.
                    // Wait, `sale.profit` is Net. Item breakdown summing to Gross might be confusing.
                    // But `SaleItem` doesn't have `fee` column.
                    // Let's leave item breakdown as is (Standard Margin) or try to fetch it?
                    // The user requirement is about the "Inventory selling price" being reduced?
                    // "harga selling price di masing masing inventory akan di kurangi"
                    // This creates a discrepancy.
                    // If we reduce the `sellingPrice` stored in `SaleItem`, then `totalAmount` (Revenue) decreases.
                    // Is that what they want? "Net Sales"?
                    // "harga selling price ... akan di kurangi biaya admin"
                    // If I change `sellingPrice` in `SaleItem`, it effectively lowers Revenue.
                    // Revenue = Selling Price * Qty.
                    // If I lower Selling Price, I lower Revenue.
                    // Profit = Lowered Revenue - COGS.
                    // This matches the math.
                    // AND it matches "selling price ... will be reduced".
                    // So, instead of `feeAmount` being separate expense, I should reduce `revenue` variable itself?
                    // `const netRevenue = revenue - feeAmount`.
                    // `const netSellingPrice = netRevenue / quantity`.
                    // And store THAT in `SaleItem`.
                    // This way `totalAmount` in Sale will be Net Revenue.
                    // And `profit` will be Net Profit.
                    // This seems to align best with "selling price ... will be reduced".
                    
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
    async getAllSales(filters?: { productName?: string; variantName?: string }): Promise<SaleResponse[]> {
        const whereClause: any = {};

        // Build where clause to filter sales by items
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

        const sales = await prisma.sale.findMany({
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
                variantName: item.variantCombination?.sku,
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
