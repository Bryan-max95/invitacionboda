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

  return <><div className="admin-session-bar"><span>Administración · Bryan &amp; Lyndel</span><button className="btn-secondary" onClick={async () => {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (response.ok) window.location.assign('/panel.bwp.bl');
    else window.alert('No se pudo cerrar la sesión. Intenta nuevamente.');
  }}>Cerrar sesión</button></div><div ref={rootRef} /><GuestList /></>;
}
