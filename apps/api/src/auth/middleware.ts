import type { NextFunction, Request, Response } from 'express';
import { getUserById, verifyToken, type AuthUser } from './service.js';

/* Express request augmentation — namespace is the supported typing pattern. */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export async function attachAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = bearerToken(req);
    if (!token) return next();
    const userId = await verifyToken(token);
    const user = await getUserById(userId);
    if (user) req.authUser = user;
    next();
  } catch {
    next();
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: { code: 'unauthorized', message: 'Authentication required' } });
    return;
  }
  next();
}
