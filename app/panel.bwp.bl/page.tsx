import type { Metadata } from 'next';
import AdminPanelClient from '../../components/AdminPanelClient';
import AdminLogin from '../../components/AdminLogin';
import { isAdmin } from '../../lib/auth';
import { readWeddingConfig } from '../../lib/wedding';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Administración | Bryan & Lyndel',
  robots: { index: false, follow: false },
};

export default async function AdminPanelPage() {
  if (!await isAdmin()) return <AdminLogin />;
  return <main><AdminPanelClient config={await readWeddingConfig()} /></main>;
}
