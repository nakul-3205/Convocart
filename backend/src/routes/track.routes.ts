import { Router } from 'express';
import { trackOrderHandler } from '../controllers/track.controller';

const router = Router();
router.get('/:orderId', trackOrderHandler);
export default router;