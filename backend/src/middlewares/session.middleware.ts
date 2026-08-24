import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

const COOKIE_NAME = 'convocart_session';
const isProd = process.env.NODE_ENV === 'production';

export async function sessionMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let sessionId = req.cookies[COOKIE_NAME];

    if (sessionId) {
      const existing = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!existing) sessionId = undefined; // stale/forged cookie — treat as new
    }

    if (!sessionId) {
      const session = await prisma.session.create({ data: {} });
      sessionId = session.id;
      res.cookie(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    req.sessionId = sessionId;
    next();
  } catch (err) {
    next(err);
  }
}
