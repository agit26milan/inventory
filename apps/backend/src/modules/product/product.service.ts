import prisma from '../../database/client';
import { CreateProductDTO, UpdateProductDTO, ProductWithStock } from './product.types';
import { AppError } from '../../utils/error-handler';

export class ProductService {
    async createProduct(data: CreateProductDTO) {
        // Check if SKU already exists
        const existingProduct = await prisma.product.findUnique({
            where: { sku: data.sku },
        });

        if (existingProduct) {
            throw new AppError(400, 'Product with this SKU already exists');
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku,
                stockMethod: data.stockMethod,
                sellingPrice: data.sellingPrice,
            },
        });

        return product;
    }

    async getAllProducts(): Promise<ProductWithStock[]> {
        const products = await prisma.product.findMany({
            include: {
                inventoryBatches: {
                    select: {
                        remainingQuantity: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            stockMethod: product.stockMethod,
            sellingPrice: Number(product.sellingPrice),
            currentStock: product.inventoryBatches.reduce(
                (sum, batch) => sum + batch.remainingQuantity,
                0
            ),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        }));
    }

    async getProductById(id: number): Promise<ProductWithStock> {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                inventoryBatches: {
                    select: {
                        remainingQuantity: true,
                    },
                },
            },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            stockMethod: product.stockMethod,
            sellingPrice: Number(product.sellingPrice),
            currentStock: product.inventoryBatches.reduce(
                (sum, batch) => sum + batch.remainingQuantity,
                0
            ),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }

    async updateProduct(id: number, data: UpdateProductDTO) {
        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            throw new AppError(404, 'Product not found');
        }

        // Check if new SKU already exists (if SKU is being updated)
        if (data.sku && data.sku !== existingProduct.sku) {
            const duplicateSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            });

            if (duplicateSku) {
                throw new AppError(400, 'Product with this SKU already exists');
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data,
        });

        return product;
    }

    async deleteProduct(id: number) {
        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                inventoryBatches: true,
                saleItems: true,
            },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Check if product has inventory or sales history
        if (product.inventoryBatches.length > 0 || product.saleItems.length > 0) {
            throw new AppError(
                400,
                'Cannot delete product with existing inventory or sales history'
            );
        }

        await prisma.product.delete({
            where: { id },
        });

        return { message: 'Product deleted successfully' };
    }

    async getProductWithVariants(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                variants: {
                    include: {
                        values: {
                            orderBy: {
                                createdAt: 'asc' as const,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc' as const,
                    },
                },
                variantCombinations: {
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
                        createdAt: 'desc' as const,
                    },
                },
                inventoryBatches: {
                    select: {
                        remainingQuantity: true,
                    },
                },
            },
        });

        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Format the response
        return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            stockMethod: product.stockMethod,
            sellingPrice: Number(product.sellingPrice),
            currentStock: product.inventoryBatches.reduce(
                (sum: number, batch) => sum + batch.remainingQuantity,
                0
            ),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            variants: product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                values: variant.values.map((value) => ({
                    id: value.id,
                    name: value.name,
                })),
            })),
            variantCombinations: product.variantCombinations.map((combination) => ({
                id: combination.id,
                sku: combination.sku,
                price: Number(combination.price),
                stock: combination.stock,
                values: combination.values.map((v) => ({
                    id: v.variantValue.id,
                    name: v.variantValue.name,
                    variantId: v.variantValue.variantId,
                    variantName: v.variantValue.variant.name,
                })),
            })),
        };
    }
}

export default new ProductService();
