import prisma from '../../database/client';
import { CreateVariantCombinationDTO, UpdateVariantCombinationDTO, VariantCombinationResponse } from './variant-combination.types';
import { AppError } from '../../utils/error-handler';

export class VariantCombinationService {
    async createVariantCombination(data: CreateVariantCombinationDTO): Promise<VariantCombinationResponse> {
        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Check if SKU already exists
        const existingSku = await prisma.variantCombination.findUnique({
            where: { sku: data.sku },
        });

        if (existingSku) {
            throw new AppError(400, 'SKU already exists');
        }

        // Validate that all variant values exist and belong to the product
        const variantValues = await prisma.variantValue.findMany({
            where: {
                id: { in: data.variantValueIds },
                productId: data.productId,
            },
            include: {
                variant: true,
            },
        });

        if (variantValues.length !== data.variantValueIds.length) {
            throw new AppError(400, 'One or more variant values not found or do not belong to this product');
        }

        // Check that variant values come from different variants (no duplicate variant types)
        const variantIds = variantValues.map(v => v.variantId);
        const uniqueVariantIds = new Set(variantIds);
        
        if (variantIds.length !== uniqueVariantIds.size) {
            throw new AppError(400, 'Cannot use multiple values from the same variant');
        }

        // Create variant combination with values
        const combination = await prisma.variantCombination.create({
            data: {
                productId: data.productId,
                sku: data.sku,
                price: data.price,
                stock: data.stock,
                values: {
                    create: data.variantValueIds.map(valueId => ({
                        variantValueId: valueId,
                    })),
                },
            },
            include: {
                values: {
                    include: {
                        variantValue: {
                            include: {
                                variant: true,
                            },
                        },
                    },
                },
            },
        });

        return this.formatCombinationResponse(combination);
    }

    async getVariantCombinationsByProductId(productId: number): Promise<VariantCombinationResponse[]> {
        const combinations = await prisma.variantCombination.findMany({
            where: { productId },
            include: {
                values: {
                    include: {
                        variantValue: {
                            include: {
                                variant: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return combinations.map(c => this.formatCombinationResponse(c));
    }

    async getVariantCombinationById(id: number): Promise<VariantCombinationResponse> {
        const combination = await prisma.variantCombination.findUnique({
            where: { id },
            include: {
                values: {
                    include: {
                        variantValue: {
                            include: {
                                variant: true,
                            },
                        },
                    },
                },
            },
        });

        if (!combination) {
            throw new AppError(404, 'Variant combination not found');
        }

        return this.formatCombinationResponse(combination);
    }

    async updateVariantCombination(id: number, data: UpdateVariantCombinationDTO): Promise<VariantCombinationResponse> {
        // Check if combination exists
        const existingCombination = await prisma.variantCombination.findUnique({
            where: { id },
        });

        if (!existingCombination) {
            throw new AppError(404, 'Variant combination not found');
        }

        // Check if new SKU already exists (if SKU is being updated)
        if (data.sku && data.sku !== existingCombination.sku) {
            const duplicateSku = await prisma.variantCombination.findUnique({
                where: { sku: data.sku },
            });

            if (duplicateSku) {
                throw new AppError(400, 'SKU already exists');
            }
        }

        // If updating variant values, validate them
        if (data.variantValueIds) {
            const variantValues = await prisma.variantValue.findMany({
                where: {
                    id: { in: data.variantValueIds },
                    productId: existingCombination.productId,
                },
                include: {
                    variant: true,
                },
            });

            if (variantValues.length !== data.variantValueIds.length) {
                throw new AppError(400, 'One or more variant values not found or do not belong to this product');
            }

            // Check for duplicate variant types
            const variantIds = variantValues.map(v => v.variantId);
            const uniqueVariantIds = new Set(variantIds);
            
            if (variantIds.length !== uniqueVariantIds.size) {
                throw new AppError(400, 'Cannot use multiple values from the same variant');
            }

            // Update combination with new values
            await prisma.$transaction([
                // Delete existing values
                prisma.variantCombinationValue.deleteMany({
                    where: { combinationId: id },
                }),
                // Create new values
                prisma.variantCombinationValue.createMany({
                    data: data.variantValueIds.map(valueId => ({
                        combinationId: id,
                        variantValueId: valueId,
                    })),
                }),
            ]);
        }

        // Update combination basic fields
        const updateData: any = {};
        if (data.sku) updateData.sku = data.sku;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.stock !== undefined) updateData.stock = data.stock;

        const combination = await prisma.variantCombination.update({
            where: { id },
            data: updateData,
            include: {
                values: {
                    include: {
                        variantValue: {
                            include: {
                                variant: true,
                            },
                        },
                    },
                },
            },
        });

        return this.formatCombinationResponse(combination);
    }

    async deleteVariantCombination(id: number) {
        // Check if combination exists
        const combination = await prisma.variantCombination.findUnique({
            where: { id },
        });

        if (!combination) {
            throw new AppError(404, 'Variant combination not found');
        }

        await prisma.variantCombination.delete({
            where: { id },
        });

        return { message: 'Variant combination deleted successfully' };
    }

    private formatCombinationResponse(combination: any): VariantCombinationResponse {
        return {
            id: combination.id,
            productId: combination.productId,
            sku: combination.sku,
            price: Number(combination.price),
            stock: combination.stock,
            createdAt: combination.createdAt,
            updatedAt: combination.updatedAt,
            values: combination.values?.map((v: any) => ({
                id: v.variantValue.id,
                name: v.variantValue.name,
                variantId: v.variantValue.variantId,
                variantName: v.variantValue.variant.name,
            })),
        };
    }
}

export default new VariantCombinationService();
