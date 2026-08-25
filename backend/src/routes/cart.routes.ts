import { Router } from 'express';
import { getCartHandler, addToCartHandler, removeFromCartHandler } from '../controllers/cart.controller';
import { checkoutPreviewHandler, confirmOrderHandler } from '../controllers/checkout.controller';

const router = Router();
router.get('/', getCartHandler);
router.post('/items', addToCartHandler);
router.delete('/items/:productId', removeFromCartHandler);
router.post('/checkout-preview', checkoutPreviewHandler);
router.post('/checkout-confirm', confirmOrderHandler);

export default router;
