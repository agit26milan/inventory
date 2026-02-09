import { Router } from 'express';
import productController from '../modules/product/product.controller';
import inventoryController from '../modules/inventory/inventory.controller';
import salesController from '../modules/sales/sales.controller';
import reportController from '../modules/report/report.controller';
import variantRoutes from '../modules/variant/variant.routes';
import variantCombinationRoutes from '../modules/variant-combination/variant-combination.routes';
import marketplaceFeeRoutes from './marketplace-fee.routes';
import * as equityController from '../modules/equity/equity.controller';
import * as storeExpenseController from '../modules/store-expense/store-expense.controller';
import { validate } from '../utils/validation';
import {
    createProductSchema,
    updateProductSchema,
    getProductSchema,
    deleteProductSchema,
} from '../modules/product/product.validation';
import {
    createInventoryBatchSchema,
    getInventoryByProductSchema,
    updateInventoryBatchSchema,
    deleteInventoryBatchSchema,
    getInventoryBatchSchema,
    getAllInventoryBatchesSchema
} from '../modules/inventory/inventory.validation';
import {
    createSaleSchema,
    getSaleSchema,
} from '../modules/sales/sales.validation';
import { createEquitySchema } from '../modules/equity/equity.validation';
import {
    createStoreExpenseSchema,
    updateStoreExpenseSchema,
    deleteStoreExpenseSchema,
} from '../modules/store-expense/store-expense.validation';

const router = Router();

// Product routes
router.post('/products', validate(createProductSchema), productController.create);
router.get('/products', productController.getAll);
router.get('/products/:id', validate(getProductSchema), productController.getById);
router.get('/products/:id/with-variants', validate(getProductSchema), productController.getProductWithVariants);
router.put('/products/:id', validate(updateProductSchema), productController.update);
router.delete(
    '/products/:id',
    validate(deleteProductSchema),
    productController.delete
);

// Variant routes
router.use('/variants', variantRoutes);

// Variant combination routes
router.use('/variant-combinations', variantCombinationRoutes);

// Marketplace Fee routes
router.use('/marketplace-fees', marketplaceFeeRoutes);

// Equity routes
router.post('/equity', validate(createEquitySchema), equityController.createEquity);
router.get('/equity', equityController.getAllEquities);
router.get('/equity/total', equityController.getTotalEquity);

// Store Expense routes
router.post('/store-expenses', validate(createStoreExpenseSchema), storeExpenseController.createExpense);
router.get('/store-expenses', storeExpenseController.getAllExpenses);
router.get('/store-expenses/total', storeExpenseController.getTotalExpenses);
router.put('/store-expenses/:id', validate(updateStoreExpenseSchema), storeExpenseController.updateExpense);
router.delete('/store-expenses/:id', validate(deleteStoreExpenseSchema), storeExpenseController.deleteExpense);

// Inventory routes
router.post(
    '/inventory',
    validate(createInventoryBatchSchema),
    inventoryController.createBatch
);
router.get(
    '/inventory',
    validate(getAllInventoryBatchesSchema),
    inventoryController.getAllBatches
);
router.get(
    '/inventory/product/:productId',
    validate(getInventoryByProductSchema),
    inventoryController.getBatchesByProduct
);
router.get(
    '/inventory/stock/:productId',
    validate(getInventoryByProductSchema),
    inventoryController.getCurrentStock
);
router.put(
    '/inventory/:id',
    validate(updateInventoryBatchSchema),
    inventoryController.updateBatch
);
router.get(
    '/inventory/:id',
    validate(getInventoryBatchSchema),
    inventoryController.getBatchById
);
router.delete(
    '/inventory/:id',
    validate(deleteInventoryBatchSchema),
    inventoryController.deleteBatch
);

// Sales routes
router.post('/sales', validate(createSaleSchema), salesController.create);
router.get('/sales', salesController.getAll);
router.get('/sales/:id', validate(getSaleSchema), salesController.getById);

// Report routes
router.get('/reports/sales-summary', reportController.getSalesSummary);
router.get('/reports/product-performance', reportController.getProductPerformance);
router.get('/reports/inventory-valuation', reportController.getInventoryValuation);

export default router;
