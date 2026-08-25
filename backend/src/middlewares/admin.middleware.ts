import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env';

const COOKIE_NAME = 'convocart_admin';

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.cookies[COOKIE_NAME] === 'authenticated') return next();
  res
    .status(401)
    .json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin login required' } });
}

export function checkAdminPassword(password: string): boolean {
  const expected = env.ADMIN_PASSWORD;
  return (
    expected.length === password.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(password))
  );
}
