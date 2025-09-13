/**
 * Not Found middleware
 * Handles 404 errors for undefined routes
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export const notFound = (_req: Request, _res: Response, _next: NextFunction): void => {
  const error = new AppError(`Not found - ${_req.originalUrl}`, 404);
  _next(error);
};
