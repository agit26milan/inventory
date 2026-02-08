import prisma from '../../database/client';
import { CreateMarketplaceFeeDTO, MarketplaceFeeResponse } from './marketplace-fee.types';
import { AppError } from '../../utils/error-handler';

export class MarketplaceFeeService {
    /**
     * Create or update a marketplace fee for a product
     */
    async setFee(data: CreateMarketplaceFeeDTO): Promise<MarketplaceFeeResponse> {
        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(404, `Product with ID ${data.productId} not found`);
        }

        // Upsert fee (Create if new, Update if exists)
        const fee = await prisma.marketplaceFee.upsert({
            where: {
                productId_marketplace: {
                    productId: data.productId,
                    marketplace: data.marketplace,
                },
            },
            update: {
                percentage: data.percentage,
                processFee: data.processFee,
            },
            create: {
                productId: data.productId,
                marketplace: data.marketplace,
                percentage: data.percentage,
            },
            include: {
                product: {
                    select: { name: true },
                },
            },
        });

        return {
            id: fee.id,
            productId: fee.productId,
            productName: fee.product.name,
            marketplace: fee.marketplace,
            percentage: Number(fee.percentage),
            createdAt: fee.createdAt,
            updatedAt: fee.updatedAt,
            processFee: Number(fee.processFee),
        };
    }

    /**
     * Get all fees for a specific product
     */
    async getFeesByProduct(productId: number): Promise<MarketplaceFeeResponse[]> {
        const fees = await prisma.marketplaceFee.findMany({
            where: { productId },
            include: {
                product: {
                    select: { name: true },
                },
            },
        });

        return fees.map(fee => ({
            id: fee.id,
            productId: fee.productId,
            productName: fee.product.name,
            marketplace: fee.marketplace,
            percentage: Number(fee.percentage),
            createdAt: fee.createdAt,
            updatedAt: fee.updatedAt,
            processFee: Number(fee.processFee),
        }));
    }
    
    /**
     * Delete a fee
     */
    async deleteFee(id: number): Promise<void> {
         await prisma.marketplaceFee.delete({
             where: { id }
         });
    }
}
