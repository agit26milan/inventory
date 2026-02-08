import prisma from '../../database/client';
import { CreateInventoryBatchDTO, InventoryBatchResponse } from './inventory.types';
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

    async getAllBatches(): Promise<InventoryBatchResponse[]> {
        const batches = await prisma.inventoryBatch.findMany({
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
}

export default new InventoryService();
