import { Router } from 'express';
import variantController from './variant.controller';
import { validate } from '../../utils/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createVariantValidation = z.object({
    body: z.object({
        productId: z.number().int().positive(),
        name: z.string().min(1).max(100),
    }),
});

const updateVariantValidation = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(100),
    }),
});

const variantIdValidation = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
});

const productIdValidation = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/),
    }),
});

const createVariantValueValidation = z.object({
    params: z.object({
        variantId: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(100),
    }),
});

const updateVariantValueValidation = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/),
    }),
    body: z.object({
        name: z.string().min(1).max(100),
    }),
});

// Variant routes
router.post('/', validate(createVariantValidation), variantController.createVariant);
router.get('/product/:productId', validate(productIdValidation), variantController.getVariantsByProduct);
router.get('/:id', validate(variantIdValidation), variantController.getVariantById);
router.put('/:id', validate(updateVariantValidation), variantController.updateVariant);
router.delete('/:id', validate(variantIdValidation), variantController.deleteVariant);

// Variant value routes
router.post('/:variantId/values', validate(createVariantValueValidation), variantController.createVariantValue);
router.put('/values/:id', validate(updateVariantValueValidation), variantController.updateVariantValue);
router.delete('/values/:id', validate(variantIdValidation), variantController.deleteVariantValue);

export default router;
