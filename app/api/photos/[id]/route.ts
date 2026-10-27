import { db } from '../../../../lib/db';
import { adminGuard, apiError } from '../../../../lib/api';

const ids = ['bl-40', 'bl-66', 'bl-85', 'bl-94'];
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!ids.includes(id)) return new Response(null, { status: 404 });
  try {
    const rows = await db()`SELECT encode(data, 'base64') AS data FROM wedding_photos WHERE id = ${id}`;
    if (!rows.length) return new Response(null, { status: 404 });
    return new Response(Buffer.from(rows[0].data, 'base64'), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return apiError(); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const denied = await adminGuard(request); if (denied) return denied;
    const { id } = await context.params;
    if (!ids.includes(id)) return new Response(null, { status: 404 });
    if (Number(request.headers.get('content-length') || 0) > 4000000) return new Response(null, { status: 413 });
    if (request.headers.get('content-type') !== 'image/jpeg') return new Response(null, { status: 415 });
    const image = Buffer.from(await request.arrayBuffer());
    if (image.length > 4000000 || image.length < 4 || image[0] !== 255 || image[1] !== 216 || image[2] !== 255) return Response.json({ error: 'Imagen JPEG no valida o demasiado grande.' }, { status: 400 });
    await db()`INSERT INTO wedding_photos (id, data) VALUES (${id}, decode(${image.toString('base64')}, 'base64')) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
