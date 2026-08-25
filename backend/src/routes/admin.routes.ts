import { Router } from 'express';
import { adminLoginHandler, listOrdersHandler, getOrderDetailHandler } from '../controllers/auth.controller';
import { adminAuthMiddleware } from '../middlewares/admin.middleware';

const router = Router();
router.post('/login', adminLoginHandler); 
router.get('/orders', adminAuthMiddleware, listOrdersHandler);
router.get('/orders/:orderId', adminAuthMiddleware, getOrderDetailHandler);

export default router;