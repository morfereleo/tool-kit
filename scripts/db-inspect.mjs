/**
 * Lista las filas de pro_waitlist. Con --clean-tests borra las filas de prueba
 * (correos que terminan en adtools.test).
 * Uso: node scripts/db-inspect.mjs [--clean-tests]
 */
import { existsSync, readFileSync } from 'node:fs'
import { neon } from '@neondatabase/serverless'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)="?([^"]*)"?$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
}

const sql = neon(process.env.DATABASE_URL)

if (process.argv.includes('--clean-tests')) {
  const del = await sql`DELETE FROM pro_waitlist WHERE email LIKE '%adtools.test' RETURNING id`
  console.log('filas de prueba eliminadas:', del.length)
}

const rows = await sql`SELECT email, feature, tool, lang, created_at FROM pro_waitlist ORDER BY id`
console.table(rows.map((r) => ({ ...r, created_at: String(r.created_at).slice(0, 24) })))
console.log('total:', rows.length)
