'use client';
import { useCallback, useEffect, useState } from 'react';
type Guest = { id: string; full_name: string; attendance: 'yes' | 'no'; guest_count: number; message: string; created_at: string };
export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/admin/guests', { cache: 'no-store' });
      if (!response.ok) throw new Error('No se pudo cargar la lista. Revisa tu sesión e intenta nuevamente.');
      setGuests((await response.json()).guests);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <section className="admin-guests rsvp-modal-card">
    <div className="admin-guests-header"><h2 className="rsvp-modal-title">Invitados y confirmaciones</h2><button className="btn-secondary" onClick={load} disabled={busy}>Actualizar</button></div>
    {error && <p role="alert">{error}</p>}
    {busy ? <p>Cargando invitados…</p> : !error && <>
      <p>{guests.length} respuestas · {guests.filter(g => g.attendance === 'yes').reduce((sum, g) => sum + g.guest_count, 0)} personas confirmadas · {guests.filter(g => g.attendance === 'no').length} no asistirán</p>
      {!guests.length ? <p>Aún no hay confirmaciones registradas.</p> : <div className="admin-table-scroll"><table className="admin-guests-table"><thead><tr><th>Nombre</th><th>Asistencia</th><th>Personas</th><th>Mensaje</th><th>Fecha</th></tr></thead><tbody>{guests.map(g => <tr key={g.id}><td>{g.full_name}</td><td>{g.attendance === 'yes' ? 'Sí' : 'No'}</td><td>{g.guest_count}</td><td>{g.message || '—'}</td><td>{new Date(g.created_at).toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}</td></tr>)}</tbody></table></div>}
    </>}
  </section>;
}
