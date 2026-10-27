import assert from 'node:assert/strict';
import { loadEnvFile } from 'node:process';
import { createHash, randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
loadEnvFile('.env');
const sql = neon(process.env.DATABASE_URL);
const origin = process.env.TEST_ORIGIN || 'http://localhost:3100';
let cookie = '';
const guestId = randomUUID();
const scopeIp = `integration-${randomUUID()}`;
async function request(path, method = 'GET', body, authenticated = true) {
  return fetch(origin + path, { method, headers: { Origin: origin, 'x-forwarded-for': scopeIp, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(authenticated && cookie ? { Cookie: cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
}
let settingsBefore;
let photoBefore;
let photoSnapshotTaken = false;
let sessionHash;
try {
  assert.equal((await request('/panel.bwp.bl')).status, 200);
  assert.match(await (await request('/panel.bwp.bl')).text(), /Acceso al panel/);
  assert.equal((await request('/api/admin/guests')).status, 401);
  assert.equal((await request('/api/admin/settings', 'PUT', {})).status, 401);
  assert.equal((await request('/api/admin/photos', 'DELETE')).status, 401);
  assert.equal((await request('/api/photos/bl-40', 'PUT', {})).status, 401);
  assert.equal((await request('/api/admin/login', 'POST', { username: process.env.ADMIN_USERNAME, password: 'invalid-test-password' })).status, 401);
  const login = await request('/api/admin/login', 'POST', { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/i); assert.match(setCookie, /SameSite=strict/i);
  cookie = setCookie.split(';')[0];
  sessionHash = createHash('sha256').update(cookie.split('=')[1]).digest('hex');
  assert.match(await (await request('/panel.bwp.bl')).text(), /Administraci/);
  assert.equal((await request('/api/admin/guests')).status, 200);
  assert.equal((await request('/api/admin/settings', 'PUT', {})).status, 400);
  assert.equal((await fetch(origin + '/api/admin/settings', { method: 'PUT', headers: { Cookie: cookie, Origin: 'https://untrusted.invalid', 'Content-Type': 'application/json' }, body: '{}' })).status, 403);
  settingsBefore = (await sql`SELECT config FROM wedding_settings WHERE id = 1`)[0]?.config;
  assert.ok(settingsBefore, 'La configuracion real debe estar guardada');
  assert.equal((await request('/api/admin/settings', 'PUT', settingsBefore)).status, 200);
  const invalidUrl = structuredClone(settingsBefore); invalidUrl.venue.mapUrl = 'javascript:alert(1)';
  assert.equal((await request('/api/admin/settings', 'PUT', invalidUrl)).status, 400);
  photoBefore = (await sql`SELECT encode(data, 'base64') AS data FROM wedding_photos WHERE id = 'bl-40'`)[0];
  photoSnapshotTaken = true;
  // Small JPEG fixture is removed/restored in finally; no test image remains.
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==', 'base64');
  const upload = await fetch(origin + '/api/photos/bl-40', { method: 'PUT', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'image/jpeg' }, body: jpeg });
  assert.equal(upload.status, 200);
  const image = await request('/api/photos/bl-40', 'GET', undefined, false);
  assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/jpeg');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), jpeg);
  const guest = { id: guestId, fullName: 'Verificacion temporal automatizada', attendance: 'yes', guestCount: 2, message: '', recipientTarget: 'bryan' };
  assert.equal((await request('/api/rsvp', 'POST', { ...guest, fullName: '' }, false)).status, 400);
  const confirmation = await request('/api/rsvp', 'POST', guest, false);
  assert.equal(confirmation.status, 200);
  const proof = confirmation.headers.get('set-cookie').split(';')[0];
  assert.equal((await request('/api/rsvp', 'POST', { ...guest, guestCount: 3 }, false)).status, 403);
  const updated = await fetch(origin + '/api/rsvp', { method: 'POST', headers: { Cookie: proof, Origin: origin, 'x-forwarded-for': scopeIp, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...guest, attendance: 'no' }) });
  assert.equal(updated.status, 200);
  const rows = await sql`SELECT attendance, guest_count FROM wedding_guests WHERE id = ${guestId}`;
  assert.equal(rows[0].attendance, 'no'); assert.equal(rows[0].guest_count, 0);
  assert.equal((await request('/api/admin/logout', 'POST')).status, 200);
  assert.equal((await request('/api/admin/guests')).status, 401);
  console.log('OK: login, cookies, proteccion, CSRF, validacion, configuracion, fotos, confirmaciones reales y cierre de sesion.');
} finally {
  await sql`DELETE FROM wedding_guests WHERE id = ${guestId}`;
  if (sessionHash) await sql`DELETE FROM wedding_sessions WHERE token_hash = ${sessionHash}`;
  if (settingsBefore) await sql`UPDATE wedding_settings SET config = ${JSON.stringify(settingsBefore)}::jsonb WHERE id = 1`;
  if (photoBefore) await sql`INSERT INTO wedding_photos (id, data) VALUES ('bl-40', decode(${photoBefore.data}, 'base64')) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
  else if (photoSnapshotTaken) await sql`DELETE FROM wedding_photos WHERE id = 'bl-40'`;
  // Only keys created for this test's unique IP.
  const { createHmac } = await import('node:crypto');
  for (const scope of ['login', 'rsvp']) {
    const key = createHmac('sha256', process.env.SESSION_SECRET).update(`${scope}:${scopeIp}`).digest('hex');
    await sql`DELETE FROM wedding_rate_limits WHERE key = ${key}`;
  }
  console.log('Limpieza terminada: sin invitados ni fotos de prueba en Neon.');
}
