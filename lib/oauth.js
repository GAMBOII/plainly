/**
 * lib/oauth.js — the calls that need the OAuth App's client secret.
 *
 * All server-side. The secret must never reach the browser bundle, which is
 * the whole reason these endpoints exist instead of the frontend talking to
 * GitHub directly.
 *
 * Imported by the Vercel functions in api/oauth/ and by server.js for local
 * development, so the two environments can't drift apart.
 *
 * Deliberately outside api/. Every file in that directory is a candidate route
 * to Vercel; this one is a module, and a module that fails to look like a
 * handler can fail the build — taking the whole deployment with it and leaving
 * the previous version live.
 */

import crypto from 'node:crypto'

const TOKEN_URL = 'https://github.com/login/oauth/access_token'
const API = 'https://api.github.com'

function credentials() {
  const id = process.env.GITHUB_CLIENT_ID
  const secret = process.env.GITHUB_CLIENT_SECRET
  if (!id || !secret) throw new Error('missing_oauth_config')
  return { id, secret }
}

/**
 * Trade the one-time code GitHub sent back for an access token.
 * Throws with a GitHub-supplied reason when GitHub refuses.
 */
export function getAuthorizeUrl(state, verifier) {
  const { id } = credentials()
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return 'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(id)}` +
    '&scope=repo' +
    `&state=${encodeURIComponent(state)}` +
    `&code_challenge=${encodeURIComponent(challenge)}&code_challenge_method=S256`
}

export async function exchangeCode(code, verifier) {
  const { id, secret } = credentials()

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: id, client_secret: secret, code, code_verifier: verifier }),
  })
  const data = await response.json()

  if (data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'no_token')
  }
  return data.access_token
}

function appAuth() {
  const { id, secret } = credentials()
  return {
    id,
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  }
}

/**
 * Revoke the whole authorization, not just this token.
 *
 * GitHub: "Deleting an application's grant will also delete all OAuth tokens
 * associated with the application for the user. Once deleted, the application
 * will have no access to the user's account and will no longer be listed on
 * the application authorizations settings screen."
 *
 * That last part is the point. While the grant exists, GitHub skips the
 * authorize page entirely — its own docs say a user who has already authorized
 * these scopes "won't be shown the OAuth authorization page … this step of the
 * flow will automatically complete". Deleting the *token* instead would leave
 * the grant standing and the next sign-in would still be silent.
 *
 * Documented responses are 204 and 422 only. Anything that isn't 204 is
 * reported as a failure rather than assumed away — the user is told GitHub may
 * still list Yourkly, which is true, instead of being told it worked.
 */
export async function revokeGrant(token) {
  const { id, headers } = appAuth()

  const response = await fetch(`${API}/applications/${id}/grant`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ access_token: token }),
  })

  return { revoked: response.status === 204, status: response.status }
}

/**
 * Ask GitHub whether this token is still live, so Account can state the
 * connection rather than assume it. 200 means yes, 404 means no; anything else
 * means we don't know, and "don't know" must never be rendered as "connected".
 */
export async function checkToken(token) {
  const { id, headers } = appAuth()

  const response = await fetch(`${API}/applications/${id}/token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ access_token: token }),
  })

  if (response.status === 200) return { connected: true }
  if (response.status === 404) return { connected: false }
  return { connected: null }   // unknown — say so on screen
}
