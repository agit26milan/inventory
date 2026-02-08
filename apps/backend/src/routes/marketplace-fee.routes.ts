import { Router } from 'express';
import { setFee, getFeesByProduct, deleteFee } from '../modules/marketplace-fee/marketplace-fee.controller';
import { validate } from '../utils/validation';
import { createMarketplaceFeeSchema } from '../modules/marketplace-fee/marketplace-fee.validation';

const router = Router();

router.post('/', validate(createMarketplaceFeeSchema), setFee);
router.get('/product/:productId', getFeesByProduct);
router.delete('/:id', deleteFee);

export default router;
