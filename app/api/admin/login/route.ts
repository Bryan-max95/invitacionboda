import { cookies } from 'next/headers';
import { createSession, equal, rateLimit, sameOrigin, sessionCookie } from '../../../../lib/auth';
import { apiError } from '../../../../lib/api';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
  try {
    if (!await rateLimit(request, 'login', 10)) return Response.json({ error: 'Demasiados intentos. Espera 15 minutos.' }, { status: 429 });
    const body = await request.json();
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return apiError();
    if (typeof body.username !== 'string' || typeof body.password !== 'string' || body.username.length > 100 || body.password.length > 200 || !equal(body.username, process.env.ADMIN_USERNAME) || !equal(body.password, process.env.ADMIN_PASSWORD)) {
      return Response.json({ error: 'Usuario o contrasena incorrectos.' }, { status: 401 });
    }
    const token = await createSession();
    (await cookies()).set(sessionCookie, token, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'strict', path: '/', maxAge: 28800 });
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
