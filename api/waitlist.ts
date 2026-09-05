import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

const FEATURES = new Set(['branding', 'proposal_link', 'esign', 'dynamic_qr', 'rate_alerts'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = (typeof req.body === 'object' && req.body) || {}
  const email = String(body.email ?? '').trim().toLowerCase()
  const feature = String(body.feature ?? '')
  const tool = String(body.tool ?? '').slice(0, 40)
  const lang = body.lang === 'en' ? 'en' : 'es'

  if (!EMAIL_RE.test(email) || email.length > 254) {
    res.status(400).json({ error: 'invalid_email' })
    return
  }
  if (!FEATURES.has(feature)) {
    res.status(400).json({ error: 'invalid_feature' })
    return
  }

  const sql = neon(process.env.DATABASE_URL!)
  const inserted = await sql`
    INSERT INTO pro_waitlist (email, feature, tool, lang)
    VALUES (${email}, ${feature}, ${tool}, ${lang})
    ON CONFLICT (email, feature) DO NOTHING
    RETURNING id
  `
  res.status(200).json({ ok: true, already: inserted.length === 0 })
}
