import { readSession, originIsSameSite } from '../lib/session.js'
import { limit } from '../lib/security.js'

export default async function handler(req, res) {
  // Every response can contain account data or authentication state.
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  // Browsers often omit Origin on a same-site GET. This endpoint only returns
  // session state; cross-site scripts cannot read it without CORS permission,
  // so accept an absent Origin but still reject an explicit foreign one.
  if (req.headers?.origin && !originIsSameSite(req)) return res.status(403).json({ error: 'forbidden' })
  if (!limit(req, res, { max: 60, windowMs: 60_000 })) return
  const session = readSession(req)
  if (!session) return res.status(401).json({ error: 'not_signed_in' })

  try {
    const response = await fetch('https://api.github.com/user', {
      signal: AbortSignal.timeout(7000),
      headers: {
        Authorization: `Bearer ${session.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
    if (!response.ok) return res.status(401).json({ error: 'not_signed_in' })
    res.json({ user: await response.json(), csrf: session.csrf })
  } catch {
    res.status(503).json({ error: 'session_unavailable' })
  }
}

