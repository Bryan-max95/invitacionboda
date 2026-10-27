import 'server-only';
import { db } from './db';
import { DEFAULT_WEDDING_CONFIG } from '../src/config/weddingConfig';
import type { WeddingConfig } from '../src/types';

export async function readWeddingConfig(): Promise<WeddingConfig> {
  const sql = db();
  await sql`INSERT INTO wedding_settings (id, config) VALUES (1, ${JSON.stringify({ time: DEFAULT_WEDDING_CONFIG.time, venue: DEFAULT_WEDDING_CONFIG.venue, whatsapp: DEFAULT_WEDDING_CONFIG.whatsapp, itinerary: DEFAULT_WEDDING_CONFIG.itinerary })}::jsonb) ON CONFLICT (id) DO NOTHING`;
  const [settings, photos] = await Promise.all([
    sql`SELECT config FROM wedding_settings WHERE id = 1`,
    sql`SELECT id, updated_at FROM wedding_photos`,
  ]);
  const config = structuredClone(DEFAULT_WEDDING_CONFIG);
  const saved = settings[0]?.config;
  if (saved) {
    config.time = saved.time;
    config.venue = saved.venue;
    config.whatsapp = saved.whatsapp;
    config.itinerary = saved.itinerary;
  }
  config.photos = config.photos.map(photo => {
    const stored = photos.find(row => row.id === photo.id);
    return stored ? { ...photo, publicPath: `/api/photos/${photo.id}?v=${encodeURIComponent(String(stored.updated_at))}` } : photo;
  });
  return config;
}
