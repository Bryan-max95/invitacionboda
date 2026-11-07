'use client';

import { useEffect, useRef } from 'react';
import { ConfigAndExportDrawer } from '@/components/ConfigAndExportDrawer';
import type { WeddingConfig } from '@/types';
import GuestList from './GuestList';

export default function AdminPanelClient({ config }: { config: WeddingConfig }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    new ConfigAndExportDrawer(root, config, {
      onConfigUpdated: () => {},
      onPhotosUpdated: () => {},
    });
    return () => { root.replaceChildren(); };
  }, [config]);

  return <div className="admin-workspace"><div className="admin-session-bar"><span>Administración · Lyndel &amp; Bryan</span><button className="btn-secondary" onClick={async () => {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (response.ok) window.location.assign('/panel.bwp.bl');
    else window.alert('No se pudo cerrar la sesión. Intenta nuevamente.');
  }}>Cerrar sesión</button></div><header className="admin-dashboard-heading"><p>18 DICIEMBRE 2026 · LYNDEL &amp; BRYAN</p><h1>Todo para nuestro gran día</h1><span>Invitados, recuerdos y detalles en un solo lugar.</span></header><GuestList /><div ref={rootRef} /></div>;
}
