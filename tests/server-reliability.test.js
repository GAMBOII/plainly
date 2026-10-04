import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { exchangeCode, checkToken, revokeGrant } from '../lib/oauth.js'
import { setSession } from '../lib/session.js'
import sessionHandler from '../api/session.js'
import proxyHandler from '../api/github/[...path].js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

function response() {
  return {
    headers: {}, statusCode: 200,
    setHeader(k, v) { this.headers[k] = v }, getHeader(k) { return this.headers[k] },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }, send(body) { this.body = body; return this },
  }
}

function request(method = 'GET') {
  process.env.GITHUB_SESSION_SECRET = Buffer.alloc(32, 3).toString('base64url')
  const res = response()
  const csrf = setSession(res, 'test-token')
  return { method, url: '/api/github/user', headers: { cookie: res.headers['Set-Cookie'].split(';')[0], 'x-csrf-token': csrf } }
}

test('OAuth calls have an abort signal while preserving token and status outcomes', async () => {
  process.env.GITHUB_CLIENT_ID = 'test-id'
  process.env.GITHUB_CLIENT_SECRET = 'test-secret'
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    assert.ok(options.signal instanceof AbortSignal)
    return { status: options.method === 'DELETE' ? 204 : 200, json: async () => ({ access_token: 'token' }) }
  }
  assert.equal(await exchangeCode('code', 'verifier'), 'token')
  assert.deepEqual(await checkToken('token'), { connected: true })
  assert.deepEqual(await revokeGrant('token'), { revoked: true, status: 204 })
  assert.equal(calls.length, 3)
  assert.equal(JSON.parse(calls[0].options.body).code_verifier, 'verifier')
})

test('session provider failure returns a noncacheable unavailable response', async () => {
  globalThis.fetch = async (_url, options) => { assert.ok(options.signal); throw new DOMException('timed out', 'TimeoutError') }
  const res = response()
  await sessionHandler(request(), res)
  assert.equal(res.statusCode, 503)
  assert.deepEqual(res.body, { error: 'session_unavailable' })
  assert.equal(res.headers['Cache-Control'], 'no-store')
})

test('proxy provider failure returns a noncacheable unavailable response', async () => {
  globalThis.fetch = async (_url, options) => { assert.ok(options.signal); throw new DOMException('timed out', 'TimeoutError') }
  const res = response()
  await proxyHandler(request(), res)
  assert.equal(res.statusCode, 502)
  assert.deepEqual(res.body, { error: 'github_unavailable' })
  assert.equal(res.headers['Cache-Control'], 'no-store')
})

test('proxy keeps authentication checks and never contacts GitHub for anonymous requests', async () => {
  globalThis.fetch = async () => { assert.fail('unauthenticated upstream call') }
  const res = response()
  await proxyHandler({ method: 'GET', url: '/api/github/user', headers: {} }, res)
  assert.equal(res.statusCode, 401)
  assert.equal(res.headers['Cache-Control'], 'no-store')
})
