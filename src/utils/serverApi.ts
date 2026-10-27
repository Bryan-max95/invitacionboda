export async function serverRequest(path: string, init: RequestInit) {
  const response = await fetch(path, init);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || (response.status === 401 ? 'Tu sesion ha vencido. Vuelve a iniciar sesion.' : 'No se pudo guardar. Intenta nuevamente.'));
  }
  return response;
}
