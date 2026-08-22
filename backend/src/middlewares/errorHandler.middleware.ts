import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { fail } from '../utils/ApiResponse';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    logger.warn({ code: err.code, path: req.path }, err.message);
    return fail(res, err.code, err.message, err.status, err.details);
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  return fail(res, 'INTERNAL', 'Something went wrong. We are on it.', 500);
}