import { Router } from 'express';
import voucherController from './voucher.controller';
import { validate } from '../../utils/validation';
import { 
    createVoucherSchema, 
    updateVoucherSchema, 
    getOrDeleteVoucherSchema 
} from './voucher.validation';

const router = Router();

router.post(
    '/',
    validate(createVoucherSchema),
    voucherController.create
);

router.get(
    '/',
    voucherController.getAll
);

router.get(
    '/:id',
    validate(getOrDeleteVoucherSchema),
    voucherController.getById
);

router.put(
    '/:id',
    validate(updateVoucherSchema),
    voucherController.update
);

router.delete(
    '/:id',
    validate(getOrDeleteVoucherSchema),
    voucherController.delete
);

export default router;
