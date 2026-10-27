import { isAdmin } from '../../../../lib/auth';
import { db } from '../../../../lib/db';
import { apiError } from '../../../../lib/api';
export async function GET() {
  try {
    if (!await isAdmin()) return new Response(null, { status: 401 });
    const guests = await db()`SELECT id, full_name, attendance, guest_count, message, created_at FROM wedding_guests ORDER BY created_at DESC`;
    return Response.json({ guests }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return apiError(); }
}
