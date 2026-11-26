import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { getPool } from '../db/pool.js';

const emailSchema = z.string().email().max(320);
const passwordSchema = z.string().min(8).max(200);
const displayNameSchema = z.string().min(1).max(120).optional();

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  emailVerifiedAt?: string | null;
};

function jwtSecret(): Uint8Array {
  const secret = process.env['JWT_SECRET'];
  if (!secret || secret.length < 16) throw new Error('JWT_SECRET must be set (>=16 chars)');
  return new TextEncoder().encode(secret);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function randomToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(jwtSecret());
}

export async function issueRefreshToken(
  userId: string,
  meta?: { userAgent?: string; ip?: string },
): Promise<string> {
  const token = randomToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pool = getPool();
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address) VALUES ($1,$2,$3,$4,$5)`,
    [userId, tokenHash, expiresAt, meta?.userAgent ?? null, meta?.ip ?? null],
  );
  return token;
}

export async function rotateRefreshToken(
  refreshToken: string,
): Promise<{ userId: string; refreshToken: string; accessToken: string }> {
  const pool = getPool();
  const tokenHash = hashToken(refreshToken);
  const { rows } = await pool.query<{
    id: string;
    user_id: string;
    expires_at: string;
    revoked_at: string | null;
  }>(`SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`, [
    tokenHash,
  ]);
  const row = rows[0];
  if (!row || row.revoked_at || new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }
  await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [row.id]);
  const newRefresh = await issueRefreshToken(row.user_id);
  const accessToken = await signAccessToken(row.user_id);
  return { userId: row.user_id, refreshToken: newRefresh, accessToken };
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(refreshToken)],
  );
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const pool = getPool();
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ user: AuthUser; token: string; refreshToken: string }> {
  const email = emailSchema.parse(input.email.toLowerCase().trim());
  const password = passwordSchema.parse(input.password);
  const displayName = displayNameSchema.parse(input.displayName);
  const passwordHash = await bcrypt.hash(password, 12);
  const pool = getPool();
  const { rows } = await pool.query<AuthUser>(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name as "displayName", email_verified_at as "emailVerifiedAt"`,
    [email, passwordHash, displayName ?? null],
  );
  const user = rows[0]!;
  const token = await signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id);
  await createEmailVerificationToken(user.id);
  return { user, token, refreshToken };
}

export async function loginUser(input: {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}): Promise<{ user: AuthUser; token: string; refreshToken: string }> {
  const email = emailSchema.parse(input.email.toLowerCase().trim());
  const password = passwordSchema.parse(input.password);
  const pool = getPool();
  const { rows } = await pool.query<AuthUser & { password_hash: string }>(
    `SELECT id, email, display_name as "displayName", email_verified_at as "emailVerifiedAt", password_hash
     FROM users WHERE email = $1`,
    [email],
  );
  const row = rows[0];
  if (!row) throw new Error('INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw new Error('INVALID_CREDENTIALS');
  const user: AuthUser = {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    emailVerifiedAt: row.emailVerifiedAt ?? null,
  };
  const token = await signAccessToken(user.id);
  const refreshToken = await issueRefreshToken(user.id, {
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    ...(input.ip ? { ip: input.ip } : {}),
  });
  return { user, token, refreshToken };
}

export async function verifyAccessToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, jwtSecret());
  if (!payload.sub) throw new Error('INVALID_TOKEN');
  return payload.sub;
}

// Backward compat alias
export const verifyToken = verifyAccessToken;

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const pool = getPool();
  const { rows } = await pool.query<AuthUser>(
    `SELECT id, email, display_name as "displayName", email_verified_at as "emailVerifiedAt" FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const token = randomToken();
  const pool = getPool();
  await pool.query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '24 hours')`,
    [userId, hashToken(token)],
  );
  return token;
}

export async function verifyEmail(token: string): Promise<void> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM email_verification_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) throw new Error('INVALID_VERIFICATION_TOKEN');
  await pool.query(`UPDATE email_verification_tokens SET used_at=now() WHERE id=$1`, [row.id]);
  await pool.query(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()), updated_at=now() WHERE id=$1`,
    [row.user_id],
  );
}

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const pool = getPool();
  const { rows } = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email=$1`, [
    email.toLowerCase().trim(),
  ]);
  const user = rows[0];
  if (!user) return null;
  const token = randomToken();
  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval '1 hour')`,
    [user.id, hashToken(token)],
  );
  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const password = passwordSchema.parse(newPassword);
  const pool = getPool();
  const { rows } = await pool.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_reset_tokens WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now()`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) throw new Error('INVALID_RESET_TOKEN');
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(`UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2`, [
    passwordHash,
    row.user_id,
  ]);
  await pool.query(`UPDATE password_reset_tokens SET used_at=now() WHERE id=$1`, [row.id]);
  await revokeAllUserRefreshTokens(row.user_id);
}
