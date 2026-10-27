import 'server-only';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

export const sessionCookie = 'byl_admin_session';
export function hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
export function equal(a: string, b: string) {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export async function isAdmin() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return false;
  const rows = await db()`SELECT token_hash FROM wedding_sessions WHERE token_hash = ${hash(token)} AND expires_at > now()`;
  return rows.length > 0;
}
export async function createSession() {
  const token = randomBytes(32).toString('hex');
  await db()`INSERT INTO wedding_sessions (token_hash, expires_at) VALUES (${hash(token)}, now() + interval '8 hours')`;
  return token;
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export async function rateLimit(request: Request, scope: string, maximum: number) {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET no configurado');
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = createHmac('sha256', process.env.SESSION_SECRET).update(`${scope}:${ip}`).digest('hex');
  const rows = await db()`INSERT INTO wedding_rate_limits (key, attempts, resets_at)
    VALUES (${key}, 1, now() + interval '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN wedding_rate_limits.resets_at < now() THEN 1 ELSE wedding_rate_limits.attempts + 1 END,
      resets_at = CASE WHEN wedding_rate_limits.resets_at < now() THEN now() + interval '15 minutes' ELSE wedding_rate_limits.resets_at END
    RETURNING attempts`;
  return rows[0].attempts <= maximum;
}
