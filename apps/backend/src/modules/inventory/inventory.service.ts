import prisma from '../../database/client';
import { CreateInventoryBatchDTO, UpdateInventoryBatchDTO, InventoryBatchResponse } from './inventory.types';
import { AppError } from '../../utils/error-handler';

export class InventoryService {
    async createBatch(data: CreateInventoryBatchDTO) {
        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Verify variant combination if provided
        if (data.variantCombinationId) {
             const variant = await prisma.variantCombination.findUnique({
                 where: { id: data.variantCombinationId },
             });
             if (!variant) {
                 throw new AppError(404, 'Variant combination not found');
             }
             if (variant.productId !== data.productId) {
                 throw new AppError(400, 'Variant combination does not belong to this product');
             }
        }

        const batch = await prisma.inventoryBatch.create({
            data: {
                productId: data.productId,
                variantCombinationId: data.variantCombinationId,
                quantity: data.quantity,
                remainingQuantity: data.quantity,
                costPrice: data.costPrice,
                sellingPrice: data.sellingPrice,
            },
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
        });

        return {
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            variantName: batch.variantCombination?.sku,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
            sellingPrice: Number(batch.sellingPrice),
            createdAt: batch.createdAt,
        };
    }

    async getBatchesByProduct(productId: number): Promise<InventoryBatchResponse[]> {
        // Verify product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        const batches = await prisma.inventoryBatch.findMany({
            where: { productId },
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        return batches.map((batch) => ({
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            variantName: batch.variantCombination?.sku,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
            sellingPrice: Number(batch.sellingPrice),
            createdAt: batch.createdAt,
        }));
    }

    async getAllBatches(filters?: { productName?: string; variantName?: string }): Promise<InventoryBatchResponse[]> {
        const whereClause: any = {};

        // Build where clause based on filters
        // Note: MySQL is case-insensitive by default, so we don't need mode: 'insensitive'
        if (filters?.productName) {
            whereClause.product = {
                name: {
                    contains: filters.productName,
                },
            };
        }

        if (filters?.variantName) {
            whereClause.variantCombination = {
                sku: {
                    contains: filters.variantName,
                },
            };
        }

        const batches = await prisma.inventoryBatch.findMany({
            where: whereClause,
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        return batches.map((batch) => ({
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            variantCombinationId: batch.variantCombinationId || undefined,
            variantName: batch.variantCombination?.sku,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
            sellingPrice: Number(batch.sellingPrice),
            createdAt: batch.createdAt,
        }));
    }

    async getCurrentStock(productId: number, variantCombinationId?: number): Promise<number> {
        const whereClause: any = { productId };
        if (variantCombinationId) {
            whereClause.variantCombinationId = variantCombinationId;
        }

        const batches = await prisma.inventoryBatch.findMany({
            where: whereClause,
            select: {
                remainingQuantity: true,
            },
        });

        return batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
    }
    async updateBatch(id: number, data: UpdateInventoryBatchDTO) {
        const batch = await prisma.inventoryBatch.findUnique({
            where: { id },
        });

        if (!batch) {
            throw new AppError(404, 'Inventory batch not found');
        }

        const updates: any = {};
        if (data.costPrice) updates.costPrice = data.costPrice;
        if (data.sellingPrice) updates.sellingPrice = data.sellingPrice;

        if (data.quantity) {
            const quantityDiff = data.quantity - batch.quantity;
            const newRemaining = batch.remainingQuantity + quantityDiff;

            if (newRemaining < 0) {
                throw new AppError(400, `Cannot reduce quantity to ${data.quantity} because ${batch.quantity - batch.remainingQuantity} items have already been sold.`);
            }

            updates.quantity = data.quantity;
            updates.remainingQuantity = newRemaining;
        }

        const updatedBatch = await prisma.inventoryBatch.update({
            where: { id },
            data: updates,
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
        });

        return {
            id: updatedBatch.id,
            productId: updatedBatch.productId,
            productName: updatedBatch.product.name,
            variantCombinationId: updatedBatch.variantCombinationId || undefined,
            variantName: updatedBatch.variantCombination?.sku,
            quantity: updatedBatch.quantity,
            remainingQuantity: updatedBatch.remainingQuantity,
            costPrice: Number(updatedBatch.costPrice),
            sellingPrice: Number(updatedBatch.sellingPrice),
            createdAt: updatedBatch.createdAt,
        };
    }

    async getBatchById(id: number): Promise<InventoryBatchResponse> {
        const batch = await prisma.inventoryBatch.findUnique({
            where: { id },
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
        });

        if (!batch) {
            throw new AppError(404, 'Inventory batch not found');
        }

        return {
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            variantName: batch.variantCombination?.sku,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
            sellingPrice: Number(batch.sellingPrice),
            createdAt: batch.createdAt,
        };
    }

    async deleteBatch(id: number) {
        const batch = await prisma.inventoryBatch.findUnique({
            where: { id },
        });

        if (!batch) {
            throw new AppError(404, 'Inventory batch not found');
        }

        await prisma.inventoryBatch.delete({
            where: { id },
        });

        return { message: 'Inventory batch deleted successfully' };
    }
}

export default new InventoryService();
