import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { checkAdminPassword } from '../middlewares/admin.middleware';
import { prisma } from '../db/prisma';
import { ApiError } from '../utils/ApiError';
import { ok } from '../utils/ApiResponse';

const LoginInput = z.object({ password: z.string().min(1) });

export async function adminLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = LoginInput.safeParse(req.body);
    if (!parsed.success || !checkAdminPassword(parsed.data.password)) {
      throw new ApiError('UNAUTHORIZED', 'Invalid password');
    }
    res.cookie('convocart_admin', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 4 * 60 * 60 * 1000,
    });
    return ok(res, { authenticated: true });
  } catch (err) {
    next(err);
  }
}

export async function listOrdersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
    return ok(res, orders);
  } catch (err) {
    next(err);
  }
}

export async function getOrderDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.params.orderId;
    const orderId = typeof raw === 'string' ? raw : raw?.[0];
    if (!orderId) throw new ApiError('BAD_REQUEST', 'Missing orderId');

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        auditLogs: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new ApiError('NOT_FOUND', 'Order not found');

    const messages = await prisma.message.findMany({
      where: { sessionId: order.sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return ok(res, { order, messages });
  } catch (err) {
    next(err);
  }
}
