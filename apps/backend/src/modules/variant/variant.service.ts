import prisma from '../../database/client';
import { CreateVariantDTO, UpdateVariantDTO, CreateVariantValueDTO, UpdateVariantValueDTO } from './variant.types';
import { AppError } from '../../utils/error-handler';

export class VariantService {
    async createVariant(data: CreateVariantDTO) {
        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Check if variant with same name already exists for this product
        const existingVariant = await prisma.variant.findFirst({
            where: {
                productId: data.productId,
                name: data.name,
            },
        });

        if (existingVariant) {
            throw new AppError(400, 'Variant with this name already exists for this product');
        }

        const variant = await prisma.variant.create({
            data: {
                productId: data.productId,
                name: data.name,
            },
            include: {
                values: true,
            },
        });

        return variant;
    }

    async getVariantsByProductId(productId: number) {
        const variants = await prisma.variant.findMany({
            where: { productId },
            include: {
                values: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return variants;
    }

    async getVariantById(id: number) {
        const variant = await prisma.variant.findUnique({
            where: { id },
            include: {
                values: true,
            },
        });

        if (!variant) {
            throw new AppError(404, 'Variant not found');
        }

        return variant;
    }

    async updateVariant(id: number, data: UpdateVariantDTO) {
        // Check if variant exists
        const existingVariant = await prisma.variant.findUnique({
            where: { id },
        });

        if (!existingVariant) {
            throw new AppError(404, 'Variant not found');
        }

        // Check if new name conflicts with another variant for the same product
        const duplicateVariant = await prisma.variant.findFirst({
            where: {
                productId: existingVariant.productId,
                name: data.name,
                NOT: {
                    id: id,
                },
            },
        });

        if (duplicateVariant) {
            throw new AppError(400, 'Variant with this name already exists for this product');
        }

        const variant = await prisma.variant.update({
            where: { id },
            data: {
                name: data.name,
            },
            include: {
                values: true,
            },
        });

        return variant;
    }

    async deleteVariant(id: number) {
        // Check if variant exists
        const variant = await prisma.variant.findUnique({
            where: { id },
            include: {
                values: {
                    include: {
                        variantCombinationValues: true,
                    },
                },
            },
        });

        if (!variant) {
            throw new AppError(404, 'Variant not found');
        }

        // Check if any variant values are used in combinations
        const hasActiveCombinations = variant.values.some(
            (value) => value.variantCombinationValues.length > 0
        );

        if (hasActiveCombinations) {
            throw new AppError(
                400,
                'Cannot delete variant that has values used in variant combinations'
            );
        }

        await prisma.variant.delete({
            where: { id },
        });

        return { message: 'Variant deleted successfully' };
    }

    // Variant Value operations
    async createVariantValue(variantId: number, data: CreateVariantValueDTO) {
        // Check if variant exists
        const variant = await prisma.variant.findUnique({
            where: { id: variantId },
        });

        if (!variant) {
            throw new AppError(404, 'Variant not found');
        }

        // Check if value with same name already exists for this variant
        const existingValue = await prisma.variantValue.findFirst({
            where: {
                variantId: variantId,
                name: data.name,
            },
        });

        if (existingValue) {
            throw new AppError(400, 'Variant value with this name already exists for this variant');
        }

        const variantValue = await prisma.variantValue.create({
            data: {
                variantId: variantId,
                productId: variant.productId,
                name: data.name,
            },
        });

        return variantValue;
    }

    async updateVariantValue(id: number, data: UpdateVariantValueDTO) {
        // Check if variant value exists
        const existingValue = await prisma.variantValue.findUnique({
            where: { id },
        });

        if (!existingValue) {
            throw new AppError(404, 'Variant value not found');
        }

        // Check if new name conflicts with another value in the same variant
        const duplicateValue = await prisma.variantValue.findFirst({
            where: {
                variantId: existingValue.variantId,
                name: data.name,
                NOT: {
                    id: id,
                },
            },
        });

        if (duplicateValue) {
            throw new AppError(400, 'Variant value with this name already exists for this variant');
        }

        const variantValue = await prisma.variantValue.update({
            where: { id },
            data: {
                name: data.name,
            },
        });

        return variantValue;
    }

    async deleteVariantValue(id: number) {
        // Check if variant value exists
        const variantValue = await prisma.variantValue.findUnique({
            where: { id },
            include: {
                variantCombinationValues: true,
            },
        });

        if (!variantValue) {
            throw new AppError(404, 'Variant value not found');
        }

        // Check if value is used in any combinations
        if (variantValue.variantCombinationValues.length > 0) {
            throw new AppError(
                400,
                'Cannot delete variant value that is used in variant combinations'
            );
        }

        await prisma.variantValue.delete({
            where: { id },
        });

        return { message: 'Variant value deleted successfully' };
    }
}

export default new VariantService();
