import { adminGuard, apiError } from '../../../../lib/api';
import { settingsSchema } from '../../../../lib/validation';
import { db } from '../../../../lib/db';
export async function PUT(request: Request) {
  try {
    const denied = await adminGuard(request); if (denied) return denied;
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ error: 'Revisa la hora (h:mm), el enlace de ubicacion y los datos.' }, { status: 400 });
    await db()`INSERT INTO wedding_settings (id, config) VALUES (1, ${JSON.stringify(parsed.data)}::jsonb) ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = now()`;
    return Response.json({ ok: true });
  } catch { return apiError(); }
}
