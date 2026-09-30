/**
 * Welcome.jsx — / (signed out)  (max-width 940px)
 *
 * The signed-out landing page introduces what Yourkly does through an
 * animated product preview, then gives people one clear path into GitHub
 * sign-in. People who do not have GitHub yet can create a free account there
 * first, then return and continue through the same secure sign-in flow.
 *
 * It also starts the OAuth flow, and it is where people land when something
 * about that flow didn't work — so every failure gets a sentence saying what
 * happened and what to do, never a silent bounce.
 */

import { useEffect, useState } from 'react'
import BrandWordmark from '../components/BrandWordmark'
import storkUrl from '../assets/brand/yourkly-stork.png'
import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const missingConfig = !clientId

  const [signingIn, setSigningIn] = useState(false)
  const [startFailed, setStartFailed] = useState(false)
  const [previewScene, setPreviewScene] = useState(0)
  const [onboarding, setOnboarding] = useState(null)

  function rememberStart(source) {
    try { localStorage.setItem('yourkly_onboarding_source', source) } catch { /* continue without persistence */ }
  }

  function chooseStart(source) {
    rememberStart(source)
    if (source === 'github') startSignIn()
    else if (source === 'yourkly') {
      try { localStorage.setItem('yourkly_mode', 'native') } catch { /* continue without persistence */ }
      navigate('/native/projects')
    }
    else setOnboarding('github')
  }

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setPreviewScene(2)
      return undefined
    }

    const steps = [
      [1, 2300], [2, 4600], [0, 7200], [1, 9500], [2, 11800],
    ]
    const timers = steps.map(([scene, delay]) => setTimeout(() => setPreviewScene(scene), delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  async function startSignIn() {
    if (missingConfig || signingIn) return
    setSigningIn(true)
    setStartFailed(false)
    try {
      const response = await fetch('/api/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      if (!response.ok || !data.authorizeUrl) throw new Error('could_not_start')
      window.location.assign(data.authorizeUrl)
    } catch {
      setStartFailed(true)
      setSigningIn(false)
    }
  }

  // GitHub sends people back here with ?auth_error when sign-in doesn't finish.
  const params = new URLSearchParams(window.location.search)
  const authError = params.get('auth_error')
  const disconnectFailed = params.get('disconnect_failed') === '1'

  if (onboarding === 'choose') {
    return (
      <div className="welcome-page onboarding-page mobile-flow mobile-flow--choose">
        <div className="onboarding-shell">
          <header className="landing-header"><BrandWordmark className="brand-wordmark--landing" /><button type="button" className="landing-signin" onClick={startSignIn}>Sign in</button></header>
          <button type="button" className="back-link onboarding-back" onClick={() => setOnboarding(null)}>← Back</button>
          <div className="onboarding-progress"><span>STEP 1 OF 3</span><i><b /></i></div>
          <h1>Where is your project<br />right now?</h1>
          <p className="onboarding-lead">Tell us where you're starting from. We'll guide you from here.</p>
          <div className="onboarding-options">
            <button onClick={() => chooseStart('yourkly')}><strong>I don't want to use GitHub</strong><small>Keep my projects with Yourkly instead.</small><b>›</b></button>
            <button onClick={() => chooseStart('github')}><strong>I already have a GitHub account</strong><small>Connect my existing account.</small><b>›</b></button>
            <button onClick={() => chooseStart('new')}><strong>I don't have a GitHub account yet</strong><small>I'm new and want to create a free account.</small><b>›</b></button>
            <button onClick={() => chooseStart('computer')}><strong>My project is on my computer</strong><small>We'll help you get it into GitHub.</small><b>›</b></button>
            <button onClick={() => chooseStart('builder')}><strong>It's on Lovable, Replit, Bolt, or Cursor</strong><small>We'll remember that and continue from there.</small><b>›</b></button>
            <button onClick={() => chooseStart('other')}><strong>It's somewhere else</strong><small>We'll help you connect the pieces.</small><b>›</b></button>
          </div>
        </div>
      </div>
    )
  }

  if (onboarding === 'github') {
    return (
      <div className="welcome-page onboarding-page mobile-flow mobile-flow--github">
        <div className="onboarding-shell">
          <header className="landing-header"><BrandWordmark className="brand-wordmark--landing" /><button type="button" className="landing-signin" onClick={startSignIn}>Sign in</button></header>
          <button type="button" className="back-link onboarding-back" onClick={() => setOnboarding('choose')}>← Back</button>
          <div className="onboarding-progress"><span>STEP 2 OF 3</span><i><b className="onboarding-progress--two" /></i></div>
          <h1>Create your free<br />GitHub account</h1>
          <p className="onboarding-lead">Yourkly uses GitHub to keep your project's files and history. GitHub is free and only takes a minute.</p>
          <ol className="onboarding-checklist">
            <li><b>1</b><span>Go to GitHub <small>(opens in a new tab)</small></span></li>
            <li><b>2</b><span>Create your free account</span></li>
            <li><b>3</b><span>Come back to Yourkly</span></li>
            <li><b>4</b><span>Connect your new account</span></li>
          </ol>
          <a className="landing-cta onboarding-github-cta" href="https://github.com/signup" target="_blank" rel="noopener noreferrer">Go to GitHub ↗</a>
          <button type="button" className="text-button" onClick={startSignIn}>Already have a GitHub account? Connect instead</button>
          <div className="onboarding-return">We'll be here when you get back.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="welcome-page mobile-landing">
      <div className="landing-shell">
        <header className="landing-header">
          <BrandWordmark className="brand-wordmark--landing" />
          {!missingConfig && (
            <button type="button" className="landing-signin" onClick={startSignIn} disabled={signingIn}>
              {signingIn ? 'Opening GitHub…' : 'Sign in'}
            </button>
          )}
        </header>

        <main>
          <section className="landing-hero">
            <div className="landing-hero-copy">
              <h1>Your projects, made clear</h1>
              <p>
                Know what changed, what it means, and exactly what to do next — whether your project is kept with Yourkly or GitHub.
              </p>

              {authError === 'state_mismatch' ? (
                <p className="error-box welcome-error">
                  Yourkly couldn't confirm that sign-in started here, so it stopped. Nothing was
                  lost — press the button below to start again.
                </p>
              ) : authError ? (
                <p className="error-box welcome-error">Sign-in didn't finish. Nothing was lost — please try again.</p>
              ) : null}

              {startFailed && <p className="error-box welcome-error">Yourkly could not start the secure sign-in check. Please try again.</p>}

              {disconnectFailed && (
                <p className="error-box welcome-error">
                  You're signed out on this computer, but Yourkly couldn't reach GitHub to disconnect. You can remove
                  the connection in <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer">GitHub settings</a>.
                </p>
              )}

              {missingConfig && <p className="error-box">Configuration missing — set <code>VITE_GITHUB_CLIENT_ID</code> to enable GitHub sign-in.</p>}
              <div className="landing-cta-stack">
                <button type="button" className="landing-cta" onClick={() => chooseStart('yourkly')}>Continue with Yourkly</button>
                <button type="button" onClick={startSignIn} className="pl-btn landing-secondary-cta" disabled={missingConfig || signingIn}>
                  {signingIn ? 'Opening GitHub…' : 'Connect GitHub'}
                </button>
                <span>No new password. Your GitHub account is your login.</span>
                <span>
                  Don't have GitHub yet?{' '}
                  <button type="button" className="text-link text-button-inline" onClick={() => setOnboarding('choose')}>
                    Create a free GitHub account
                  </button>
                </span>
                <span>Your projects stay in your GitHub account. Yourkly makes them easier to understand.</span>
              </div>
            </div>

            <div className="landing-product-wrap">
              <img className="landing-stork" src={storkUrl} alt="" aria-hidden="true" />
              <div className={`landing-product-preview landing-product-preview--scene-${previewScene}`} aria-label="Yourkly project preview">
                <div className="landing-product-head">
                  <span className="landing-product-icon">y</span>
                  <span><strong>Yourkly</strong><small>Updated 2 hours ago</small></span>
                </div>
                <div className="landing-product-scenes">
                  <div className="landing-product-scene landing-product-scene--0">
                    <span className="landing-product-label">Where you left off</span>
                    <div className="landing-task-card">
                      <div><strong>Improve the landing page</strong><em>In progress</em></div>
                      <p>You were working on the welcome screen.</p>
                    </div>
                  </div>
                  <div className="landing-product-scene landing-product-scene--1">
                    <span className="landing-product-label">What changed</span>
                    <div className="landing-change-row"><b>✓</b> Updated the welcome screen</div>
                    <div className="landing-change-row landing-change-row--second"><b>✓</b> Added a share image</div>
                  </div>
                  <div className="landing-product-scene landing-product-scene--2">
                    <span className="landing-product-label">What to do next</span>
                    <div className="landing-task-card landing-task-card--next">
                      <strong>Review the landing-page update, then continue in Lovable.</strong>
                      <span className="landing-preview-action">Continue in Lovable <i aria-hidden="true">→</i></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <button type="button" className="landing-start-guide" onClick={() => setOnboarding('choose')}>Not sure where to start? We'll guide you →</button>

          <section className="landing-trust">Choose where your project lives: keep it with Yourkly, or connect GitHub. Either way, Yourkly uses plain language.</section>

          <section className="landing-steps">
            <h2>Three steps, then you're working.</h2>
            <div className="landing-step-grid">
              <article><span>01</span><h3>Choose where it lives</h3><p>Keep your project with Yourkly, or connect GitHub if you already use it.</p></article>
              <article><span>02</span><h3>Yourkly explains your project</h3><p>Where you left off, what changed, and what to do next — in plain words.</p></article>
              <article><span>03</span><h3>Continue anywhere</h3><p>Pick up the work in Yourkly, Lovable, ChatGPT, or Cursor.</p></article>
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <span>© 2026 Yourkly</span>
          <a href="https://github.com/Naylahknee/yourkly/issues/new" target="_blank" rel="noopener noreferrer">Support</a>
        </footer>
      </div>
    </div>
  )
}
