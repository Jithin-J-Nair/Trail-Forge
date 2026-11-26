import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { attachAuth, requireAuth } from './middleware.js';
import {
  createPasswordResetToken,
  createUser,
  loginUser,
  resetPassword,
  rotateRefreshToken,
  revokeRefreshToken,
  verifyEmail,
} from './service.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(120).optional(),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

export function createAuthRouter(): Router {
  const router = Router();
  router.use(attachAuth);
  router.use(authLimiter);

  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: { code: 'invalid_request', message: 'Invalid registration data' } });
      return;
    }
    try {
      const result = await createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        ...(parsed.data.displayName ? { displayName: parsed.data.displayName } : {}),
      });
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('duplicate key') || message.includes('users_email_key')) {
        res
          .status(409)
          .json({ error: { code: 'email_taken', message: 'Email already registered' } });
        return;
      }
      res.status(500).json({ error: { code: 'internal_error', message: 'Registration failed' } });
    }
  });

  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'invalid_request', message: 'Invalid login data' } });
      return;
    }
    try {
      const result = await loginUser({
        email: parsed.data.email,
        password: parsed.data.password,
        ...(req.headers['user-agent'] ? { userAgent: String(req.headers['user-agent']) } : {}),
        ...(req.ip ? { ip: req.ip } : {}),
      });
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'INVALID_CREDENTIALS') {
        res
          .status(401)
          .json({ error: { code: 'invalid_credentials', message: 'Invalid email or password' } });
        return;
      }
      res.status(500).json({ error: { code: 'internal_error', message: 'Login failed' } });
    }
  });

  router.post('/refresh', async (req, res) => {
    const token = z.string().min(10).safeParse(req.body?.refreshToken);
    if (!token.success) {
      res
        .status(400)
        .json({ error: { code: 'invalid_request', message: 'refreshToken required' } });
      return;
    }
    try {
      const result = await rotateRefreshToken(token.data);
      res.json({ token: result.accessToken, refreshToken: result.refreshToken });
    } catch {
      res.status(401).json({
        error: { code: 'invalid_refresh_token', message: 'Invalid or expired refresh token' },
      });
    }
  });

  router.post('/logout', async (req, res) => {
    const token = z.string().min(10).safeParse(req.body?.refreshToken);
    if (token.success) await revokeRefreshToken(token.data).catch(() => undefined);
    res.status(204).send();
  });

  router.post('/password-reset/request', async (req, res) => {
    const email = z.string().email().safeParse(req.body?.email);
    if (!email.success) {
      res.status(400).json({ error: { code: 'invalid_request', message: 'Valid email required' } });
      return;
    }
    const token = await createPasswordResetToken(email.data).catch(() => null);
    // In production, send email. Here we return token only in non-production for testability; never expose in prod.
    const payload: { ok: true; message: string; devToken?: string } = {
      ok: true,
      message: 'If the account exists, a reset link has been issued.',
    };
    if (process.env['NODE_ENV'] !== 'production' && token) payload.devToken = token;
    res.json(payload);
  });

  router.post('/password-reset/confirm', async (req, res) => {
    const body = z
      .object({ token: z.string().min(10), password: z.string().min(8).max(200) })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: { code: 'invalid_request', message: 'Invalid payload' } });
      return;
    }
    try {
      await resetPassword(body.data.token, body.data.password);
      res.json({ ok: true });
    } catch {
      res.status(400).json({
        error: { code: 'invalid_reset_token', message: 'Invalid or expired reset token' },
      });
    }
  });

  router.post('/verify-email', async (req, res) => {
    const token = z.string().min(10).safeParse(req.body?.token);
    if (!token.success) {
      res.status(400).json({ error: { code: 'invalid_request', message: 'token required' } });
      return;
    }
    try {
      await verifyEmail(token.data);
      res.json({ ok: true });
    } catch {
      res.status(400).json({
        error: {
          code: 'invalid_verification_token',
          message: 'Invalid or expired verification token',
        },
      });
    }
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.authUser });
  });

  return router;
}
