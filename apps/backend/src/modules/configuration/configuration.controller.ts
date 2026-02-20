import { Request, Response, NextFunction } from 'express';
import configurationService from './configuration.service';
import { successResponse } from '../../utils/response';

export class ConfigurationController {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const configs = await configurationService.getAll();
            successResponse(res, configs, 'Configurations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const key = req.params['key'] as string;
            const config = await configurationService.getByKey(key);

            if (!config) {
                res.status(404).json({ success: false, message: `Configuration '${key}' not found` });
                return;
            }

            successResponse(res, config, 'Configuration retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const key = req.params['key'] as string;
            const { value, description } = req.body as { value: string; description?: string };
            const config = await configurationService.upsert(key, value, description);
            successResponse(res, config, 'Configuration saved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new ConfigurationController();
