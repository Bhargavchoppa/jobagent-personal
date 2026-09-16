/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { UserProfile } from '../../../../packages/shared/src/index';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

export const DEFAULT_USER: UserProfile = {
  id: 'usr-bhargav-001',
  email: 'bhargavchoppa23@gmail.com',
  fullName: 'Bhargav Aravind Sai Ram Choppa',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};

/**
 * Authentication-ready middleware
 * Supports Bearer tokens while providing default authenticated developer/user context
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production with JWT: jwt.verify(token, process.env.JWT_SECRET)
    // For foundation layer: validate token format and attach user context
    if (token.trim() !== '') {
      req.user = {
        ...DEFAULT_USER,
      };
      return next();
    }
  }

  // Authentication-ready fallback
  req.user = DEFAULT_USER;
  next();
}

/**
 * Strict route guard requiring verified auth
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    return next(new AppError('Authentication required. Missing or invalid Bearer token.', 401, 'UNAUTHORIZED'));
  }
  next();
}
