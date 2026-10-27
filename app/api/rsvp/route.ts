import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { rateLimit, sameOrigin } from '../../../lib/auth';
import { guestSchema } from '../../../lib/validation';
import { db } from '../../../lib/db';
import { apiError } from '../../../lib/api';

function signature(id: string) {
  if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET no configurado');
  return createHmac('sha256', process.env.SESSION_SECRET).update(`guest:${id}`).digest('hex');
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    if (Number(request.headers.get('content-length') || 0) > 16000) return new Response(null, { status: 413 });
    const parsed = guestSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Revisa tu nombre y la cantidad de personas (1 a 12).' }, { status: 400 });
    if (!await rateLimit(request, 'rsvp', 40)) return Response.json({ error: 'Demasiados envios. Intenta mas tarde.' }, { status: 429 });
    const g = parsed.data;
    const jar = await cookies();
    const proof = jar.get(`rsvp_${g.id}`)?.value || '';
    const expected = signature(g.id);
    const canUpdate = proof.length === expected.length && timingSafeEqual(Buffer.from(proof), Buffer.from(expected));
    const rows = await db()`INSERT INTO wedding_guests (id, full_name, attendance, guest_count, message, recipient)
      VALUES (${g.id}, ${g.fullName}, ${g.attendance}, ${g.attendance === 'yes' ? g.guestCount : 0}, ${g.message}, ${g.recipientTarget})
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, attendance = EXCLUDED.attendance, guest_count = EXCLUDED.guest_count, message = EXCLUDED.message, recipient = EXCLUDED.recipient, updated_at = now()
      WHERE ${canUpdate} RETURNING id`;
    if (!rows.length) return Response.json({ error: 'No se pudo actualizar esta confirmacion.' }, { status: 403 });
    jar.set(`rsvp_${g.id}`, expected, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'strict', path: '/api/rsvp', maxAge: 31536000 });
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
