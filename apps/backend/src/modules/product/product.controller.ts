import { Request, Response, NextFunction } from 'express';
import productService from './product.service';
import { successResponse } from '../../utils/response';

export class ProductController {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.createProduct(req.body);
            successResponse(res, product, 'Product created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const products = await productService.getAllProducts();
            successResponse(res, products, 'Products retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.getProductById(Number(req.params.id));
            successResponse(res, product, 'Product retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.updateProduct(
                Number(req.params.id),
                req.body
            );
            successResponse(res, product, 'Product updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await productService.deleteProduct(Number(req.params.id));
            successResponse(res, result, 'Product deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getProductWithVariants(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const product = await productService.getProductWithVariants(Number(req.params.id));
            successResponse(res, product, 'Product with variants retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductController();
