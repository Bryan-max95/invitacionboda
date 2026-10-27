import { isAdmin, sameOrigin } from './auth';
export async function adminGuard(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
  if (!await isAdmin()) return Response.json({ error: 'Inicia sesion nuevamente.' }, { status: 401 });
}
export function apiError() {
  return Response.json({ error: 'No se pudo completar la operacion. Intenta nuevamente.' }, { status: 500 });
}
