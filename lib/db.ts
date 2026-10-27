import 'server-only';
import { neon } from '@neondatabase/serverless';

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no configurada');
  return neon(process.env.DATABASE_URL);
}
