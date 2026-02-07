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

        const batch = await prisma.inventoryBatch.create({
            data: {
                productId: data.productId,
                quantity: data.quantity,
                remainingQuantity: data.quantity,
                costPrice: data.costPrice,
            },
            include: {
                product: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return {
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return batches.map((batch) => ({
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
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
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return batches.map((batch) => ({
            id: batch.id,
            productId: batch.productId,
            productName: batch.product.name,
            quantity: batch.quantity,
            remainingQuantity: batch.remainingQuantity,
            costPrice: Number(batch.costPrice),
            createdAt: batch.createdAt,
        }));
    }

    async getCurrentStock(productId: number): Promise<number> {
        const batches = await prisma.inventoryBatch.findMany({
            where: { productId },
            select: {
                remainingQuantity: true,
            },
        });

        return batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
    }
}

export default new InventoryService();
