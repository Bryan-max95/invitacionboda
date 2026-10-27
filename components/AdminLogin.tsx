'use client';
import { useState } from 'react';
export default function AdminLogin() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <main className="admin-panel-page"><section className="rsvp-modal-card admin-login-card">
    <p className="rsvp-modal-kicker">Bryan &amp; Lyndel</p>
    <h1 className="rsvp-modal-title">Acceso al panel</h1>
    <form className="rsvp-form" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      const data = new FormData(event.currentTarget);
      try {
        const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        window.location.assign('/panel.bwp.bl');
      } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.'); setBusy(false); }
    }}>
      <label className="rsvp-field">Usuario<input name="username" className="rsvp-input" autoComplete="username" required maxLength={100} /></label>
      <label className="rsvp-field">Contraseña<input name="password" type="password" className="rsvp-input" autoComplete="current-password" required maxLength={200} /></label>
      {error && <p role="alert">{error}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Ingresando…' : 'Entrar'}</button>
      <a href="/">Volver a la invitación</a>
    </form>
  </section></main>;
}
