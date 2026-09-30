/**
 * Account.jsx — /account  (max-width 660px)
 *
 * Who you're signed in as, what Yourkly is allowed to do, and the one setting
 * (HANDOFF §7.19). Sign out lives here — it is the only way out of the app,
 * and the design's sidebar has no room for it.
 *
 * Signing out revokes the GitHub authorization, so it is the disconnect this
 * screen has always claimed to offer. That makes it slower than clearing a
 * token and worth telling the user about, hence the button state and the note.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShowGithubWords } from '../utils/settings'
import { getCsrfToken } from '../api/github'
import InteractiveProfile from '../components/InteractiveProfile'

export default function Account({ auth }) {
  const { user, token, signOut } = auth
  const navigate = useNavigate()
  const [showWords, toggleWords] = useShowGithubWords()
  const [signingOut, setSigningOut] = useState(false)

  // Whether GitHub still holds an authorization for this account. Asked, not
  // assumed — 'checking' until GitHub answers, and null if it couldn't be
  // reached, which is shown as "couldn't check" rather than as connected.
  const [connected, setConnected] = useState('checking')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    fetch('/api/oauth/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
      body: JSON.stringify({}),
    })
      .then(r => (r.ok ? r.json() : { connected: null }))
      .then(d => { if (!cancelled) setConnected(d.connected) })
      .catch(() => { if (!cancelled) setConnected(null) })
    return () => { cancelled = true }
  }, [token])

  async function handleSignOut() {
    setSigningOut(true)
    const { revoked } = await signOut()
    // You're signed out either way. If GitHub still lists Yourkly, the Welcome
    // screen says so and points at where to remove it.
    navigate(revoked ? '/' : '/?disconnect_failed=1', { replace: true })
  }

  return (
    <div className="screen-padded account-screen">
      <h1 className="account-title">Account</h1>

      <InteractiveProfile
        embedded
        variant="yourkly"
        profile={{
          name: user?.name || user?.login || 'Your profile',
          username: user?.login,
          image: user?.avatar_url,
          links: user?.login
            ? [{ label: 'Open GitHub profile', href: user.html_url || `https://github.com/${user.login}`, icon: 'github' }]
            : undefined,
        }}
        isOwner
      />

      <div className="account-card">
        <div className="account-sub">Signed in with GitHub as {user?.login || '—'}</div>

        <div className="account-permission">
          <div className="account-tick" aria-hidden="true">✓</div>
          <div className="account-permission-text">
            Yourk can read and save to your projects. You can disconnect any time and your
            files stay in GitHub.
          </div>
        </div>

        {/* Asked of GitHub, not inferred from being signed in. */}
        <div className="account-connection">
          {connected === 'checking' && 'Checking with GitHub…'}
          {connected === true && (
            <>
              GitHub lists Yourk as connected to this account. You can see it at{' '}
              <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">
                github.com/settings/applications
              </a>.
            </>
          )}
          {connected === false && 'GitHub no longer lists Yourk as connected. Signing in again will ask you to allow access.'}
          {connected === null && "Yourk couldn't check with GitHub just now, so it can't tell you whether the connection is still there."}
        </div>
      </div>

      <div className="account-card account-card--setting">
        <div className="account-setting-title">Show technical GitHub words</div>
        <div className="account-setting-body">
          Adds the real GitHub term in grey next to Yourk's plain-English label, so you learn
          them as you go.
        </div>
        <button className="pl-btn" onClick={toggleWords}>
          {showWords ? 'Turn off technical words' : 'Turn on technical words'}
        </button>
      </div>

      <div className="account-signout">
        <button className="pl-btn" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <span className="account-signout-note">
          This also disconnects Yourk from your GitHub account. Your files stay in GitHub,
          and anything you haven't saved yet stays on this computer. Next time you sign in,
          GitHub will ask you to allow access again.
        </span>
      </div>
    </div>
  )
}
