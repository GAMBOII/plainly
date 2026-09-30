import { useState, useEffect } from 'react'
import { getCsrfToken, setCsrfToken } from '../api/github'

export function useAuth() {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // A version before 2026-09-03 stored the raw GitHub credential here. It is
    // no longer read or needed, so remove it as soon as the secure session
    // version loads instead of leaving a usable credential in the browser.
    try { localStorage.removeItem('plainly_token') } catch { /* storage may be blocked */ }
    fetch('/api/session')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.user || !data?.csrf) return
        setCsrfToken(data.csrf)
        setUser(data.user)
        setToken('session')
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function signIn() {
    // The OAuth callback has already set the HttpOnly session cookie. Reloading
    // is the safest way to begin with a fresh server-verified session.
    window.location.assign('/')
  }

  /**
   * Signs out here, then disconnects Yourkly from GitHub.
   *
   * The stored token goes first, before anything can fail: close the tab
   * mid-request and you are still signed out next time. Nobody gets stuck
   * signed in because a network call didn't land.
   *
   * React state is cleared *after* the request, deliberately. Clearing it
   * first unmounts the screen that called this — Protected bounces to "/" the
   * moment the token goes — and the caller's navigate() then fires from a dead
   * component, updating the URL without re-rendering. The failure message
   * never appeared. Clearing afterwards puts the state change in the same tick
   * as the caller's navigate, so React renders both together.
   *
   * Drafts (plainly_drafts_*) are deliberately left alone. They are the one
   * store that holds work GitHub doesn't have yet.
   */
  async function signOut() {
    let revoked = true
    if (token) {
      try {
        const r = await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
          body: JSON.stringify({}),
          // A hanging request must not leave someone staring at "Signing out…".
          signal: AbortSignal.timeout(8000),
        })
        revoked = r.ok
      } catch {
        revoked = false
      }
    }

    setToken(null)
    setUser(null)
    setCsrfToken('')
    return { revoked }
  }

  return { token, user, loading, signIn, signOut }
}
