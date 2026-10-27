import { cookies } from 'next/headers';
import { hash, sameOrigin, sessionCookie } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { apiError } from '../../../../lib/api';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const jar = await cookies();
    const token = jar.get(sessionCookie)?.value;
    if (token) await db()`DELETE FROM wedding_sessions WHERE token_hash = ${hash(token)}`;
    jar.delete(sessionCookie);
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
