/**
 * Crea/actualiza el esquema de la base de datos Neon.
 * Uso: node scripts/db-setup.mjs  (lee DATABASE_URL de .env.local o del entorno)
 */
import { existsSync, readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL — corre `vercel env pull .env.local` primero')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

await sql`CREATE TABLE IF NOT EXISTS pro_waitlist (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  feature TEXT NOT NULL,
  tool TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, feature)
)`

const r = await sql`SELECT count(*)::int AS n FROM pro_waitlist`
console.log('tabla pro_waitlist lista · filas:', r[0].n)
