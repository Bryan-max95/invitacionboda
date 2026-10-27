import { db } from '../../../../lib/db';
import { adminGuard, apiError } from '../../../../lib/api';
export async function DELETE(request: Request) {
  try {
    const denied = await adminGuard(request); if (denied) return denied;
    await db()`DELETE FROM wedding_photos`;
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
