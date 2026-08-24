import { Router } from 'express';
import { searchProductsHandler } from '../controllers/prodcuts.controller';

const router = Router();
router.get('/', searchProductsHandler);

export default router;