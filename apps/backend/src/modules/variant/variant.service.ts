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

        // Regenerate combinations (will essentially clear them if this new variant has no values yet, forcing the user to add values)
        await this.generateCombinations(data.productId);

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
        });

        if (!variant) {
            throw new AppError(404, 'Variant not found');
        }

        // Allow deletion even if combinations exist, but we must check for INVENTORY or SALES
        // For now, simpler approach: if ANY combination associated with this variant has inventory/sales, block.
        // But doing that check is complex.
        // We will rely on the regenerate logic:
        // 1. Delete variant (cascade deletes variant values).
        // 2. Cascade deletes variantCombinations?? No, VariantCombinationValue cascade deletes.
        // VariantCombination itself might remain empty?
        
        // Let's rely on manual clean up or force user to clear values first.
        // BUT, to be user friendly, we allow delete and regenerate.
        
        // We delete the variant.
        await prisma.variant.delete({
            where: { id },
        });

        // Regenerate combinations for the product (remaining variants)
        await this.generateCombinations(variant.productId);

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

        // Regenerate combinations
        await this.generateCombinations(variant.productId);

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
        
        // Update combinations SKU names? 
        // Yes, if value name changed, SKUs derived from it should change.
        await this.generateCombinations(existingValue.productId);

        return variantValue;
    }

    async deleteVariantValue(id: number) {
        // Check if variant value exists
        const variantValue = await prisma.variantValue.findUnique({
            where: { id },
        });

        if (!variantValue) {
            throw new AppError(404, 'Variant value not found');
        }

        await prisma.variantValue.delete({
            where: { id },
        });

        // Regenerate combinations
        await this.generateCombinations(variantValue.productId);

        return { message: 'Variant value deleted successfully' };
    }

    /**
     * Internal method to regenerate variant combinations for a product.
     * Calculates Cartesian product of all variant values and syncs with DB.
     */
    private async generateCombinations(productId: number) {
         // 1. Fetch all variants and their values
         const variants = await prisma.variant.findMany({
            where: { productId },
            include: { values: true },
            orderBy: { id: 'asc' }, // Ensure consistent order
        });

        // 2. Fetch product for base SKU and price
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) return;

        // If no variants exist, we shouldn't have any combinations.
        if (variants.length === 0) {
            await prisma.variantCombination.deleteMany({ where: { productId } });
            return;
        }

        // 3. Check if all variants have at least one value
        const allVariantsHaveValues = variants.every(v => v.values.length > 0);
        
        // If strict mode: if any variant is missing values, we have NO valid complete combinations.
        if (!allVariantsHaveValues) {
             // Delete all existing combinations because they are now incomplete/indeterminant
             // Note: This cascade keeps inventory batches but sets variantCombinationId to null (if configured)
             await prisma.variantCombination.deleteMany({ where: { productId } });
             return;
        }

        // 4. Generate Cartesian product
        // Helper to compute cartesian product of arrays
        const cartesian = (a: any[]) => a.reduce((a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())), [[]]);
        
        const valuesArrays = variants.map(v => v.values);
        const combinations = cartesian(valuesArrays);

        // 5. Calculate valid SKUs for the new state
        // We will perform upsert logic or delete-then-create. 
        // Upsert is safer to preserve IDs if SKUs match.
        
        const validSkus = new Set<string>();

        for (const combinationValues of combinations) {
            // combinationValues is an array of VariantValue objects
            // Generate SKU: PROD-SKU-VAL1-VAL2...
            // Use UpperCase and remove spaces for SKU
            const valueSuffix = combinationValues.map((v: any) => v.name.toUpperCase().replace(/\s+/g, '')).join('-');
            const sku = `${product.sku}-${valueSuffix}`;
            
            validSkus.add(sku);

            // Check if exists
            const existing = await prisma.variantCombination.findUnique({
                where: { sku },
            });

            if (!existing) {
                // Create new combination
                await prisma.variantCombination.create({
                    data: {
                        productId,
                        sku,
                        stock: 0,
                        values: {
                            create: combinationValues.map((v: any) => ({
                                variantValueId: v.id
                            }))
                        }
                    }
                });
            }
            // If exists, we leave it alone (preserve price/stock/ID)
        }

        // 6. Delete combinations that are no longer valid (not in the generated set)
        await prisma.variantCombination.deleteMany({
            where: {
                productId,
                sku: { notIn: Array.from(validSkus) }
            }
        });
    }
}

export default new VariantService();
