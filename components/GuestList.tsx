'use client';
import { useCallback, useEffect, useState } from 'react';
type Guest = { id: string; full_name: string; guest_names: string[]; attendance: 'yes' | 'no'; guest_count: number; message: string; created_at: string };
export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
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
  const visible = guests.filter(g => (filter === 'all' || g.attendance === filter) && [g.full_name, ...(g.guest_names || [])].some(name => name.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
  return <section className="admin-guests rsvp-modal-card">
    <div className="admin-guests-header"><h2 className="rsvp-modal-title">Invitados y confirmaciones</h2><button className="btn-secondary" onClick={load} disabled={busy}>Actualizar</button></div>
    {error && <p role="alert">{error}</p>}
    {busy ? <p>Cargando invitados…</p> : !error && <>
      <div className="admin-stat-grid"><div><span>Registros recibidos</span><strong>{guests.length}</strong></div><div><span>Personas que van a asistir</span><strong>{guests.filter(g => g.attendance === 'yes').reduce((sum, g) => sum + g.guest_count, 0)}</strong></div><div><span>No podrán asistir</span><strong>{guests.filter(g => g.attendance === 'no').length}</strong></div></div>
      <div className="admin-guest-tools"><input className="rsvp-input" aria-label="Buscar invitado" placeholder="Buscar por nombre…" value={query} onChange={e => setQuery(e.target.value)} /><select className="rsvp-input" aria-label="Filtrar respuestas" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Todas las respuestas</option><option value="yes">Van a asistir</option><option value="no">No podrán asistir</option></select></div>
      {!guests.length ? <p>Aún no hay confirmaciones registradas.</p> : <div className="admin-table-scroll"><table className="admin-guests-table"><thead><tr><th>Nombre</th><th>Asistir</th><th>Personas</th><th>Mensaje</th><th>Fecha</th></tr></thead><tbody>{visible.map(g => <tr key={g.id}><td><strong>{g.full_name}</strong>{(g.guest_names || []).slice(1).map((name, i) => <span className="admin-companion" key={i}>{name}</span>)}</td><td>{g.attendance === 'yes' ? 'Sí' : 'No'}</td><td>{g.guest_count}</td><td>{g.message || '—'}</td><td>{new Date(g.created_at).toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}</td></tr>)}</tbody></table>{!visible.length && <p>No hay invitados que coincidan con la búsqueda.</p>}</div>}
    </>}
  </section>;
}
