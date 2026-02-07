import { Router } from 'express';
import variantCombinationController from './variant-combination.controller';
import { validate } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createVariantCombinationValidation = z.object({
    body: z.object({
        productId: z.number().int().positive(),
        sku: z.string().min(1).max(100),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        variantValueIds: z.array(z.number().int().positive()).min(1),
    }),
});

const updateVariantCombinationValidation = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        sku: z.string().min(1).max(100).optional(),
        price: z.number().positive().optional(),
        stock: z.number().int().min(0).optional(),
        variantValueIds: z.array(z.number().int().positive()).min(1).optional(),
    }),
});

const combinationIdValidation = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

const productIdValidation = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/),
    }),
});

// Variant combination routes
router.post('/', validate(createVariantCombinationValidation), variantCombinationController.createVariantCombination);
router.get('/product/:productId', validate(productIdValidation), variantCombinationController.getVariantCombinationsByProduct);
router.get('/:id', validate(combinationIdValidation), variantCombinationController.getVariantCombinationById);
router.put('/:id', validate(updateVariantCombinationValidation), variantCombinationController.updateVariantCombination);
router.delete('/:id', validate(combinationIdValidation), variantCombinationController.deleteVariantCombination);

export default router;
