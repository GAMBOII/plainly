/**
 * Home.jsx — / (max-width 1000px)
 *
 * Answers three questions the moment it opens: where did I leave off, what
 * happened since, what should I do next (HANDOFF §7.3).
 *
 * Order: greeting → explainer → CONTINUE WHERE YOU LEFT OFF → WHAT NEEDS YOUR
 * CHANGE INBOX → recent projects + recent activity.
 *
 * The three hero sentences come from heroFor() — never computed here.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUpdates, getActiveUpdate, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { greeting, timeAgo } from '../utils/time'
import { getCommits } from '../api/github'
import { useProjects } from '../hooks/useProjects'
import { getMemory } from '../utils/projectMemory'
import { getDrafts } from '../utils/drafts'
import { activityEvents } from '../utils/activity'
import { projectName } from '../utils/projectName'
import { projectStatus } from '../utils/projectStatus'
import { ownerOf } from '../utils/useProject'
import StorkDelivery from '../components/StorkDelivery'

const EXPLAINER_DISMISSED_KEY = 'plainly_home_explainer_dismissed'

export default function Home({ auth }) {
  const { user, token } = auth
  const navigate = useNavigate()
  // Same list, same choice, as My Projects and Recent Activity.
  const { projects: repos, loading, error } = useProjects(auth)
  const [explainerDismissed, setExplainerDismissed] = useState(() => {
    try {
      return localStorage.getItem(EXPLAINER_DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const [commitsByRepo, setCommitsByRepo] = useState({})



  const owner = user?.login
  const firstName = user?.name?.split(' ')[0] || user?.login || ''
  let onboardingSource = null
  try { onboardingSource = localStorage.getItem('yourkly_onboarding_source') } catch { /* optional */ }

  const onboardingCopy = {
    builder: {
      title: 'Bring in the project you already started',
      body: 'You told us your project is in Lovable, Replit, Bolt, or Cursor. Your GitHub account is connected now, so we can continue from there without making you learn GitHub first.',
      cta: 'Continue with my project',
    },
    computer: {
      title: 'Bring in the project on your computer',
      body: 'Your GitHub account is connected. Next, Yourkly will guide you through getting the project into the account that keeps its files and history.',
      cta: 'Continue with my project',
    },
    other: {
      title: 'Let’s connect the project you already have',
      body: 'Your GitHub account is connected. Tell Yourkly where the project lives and we’ll continue from there in plain language.',
      cta: 'Continue with my project',
    },
    new: {
      title: 'Make your first project',
      body: 'Your GitHub account is connected. Give your project a name and Yourkly will create the GitHub project underneath for you.',
      cta: 'Create my first project',
    },
  }[onboardingSource]

  // Recent Save Points for the projects on screen — this is what fills
  // "what you and your AI tools have done" before any update exists.
  useEffect(() => {
    if (!token || !owner || repos.length === 0) return
    let cancelled = false
    Promise.all(repos.slice(0, 4).map(r =>
      getCommits(token, owner, r.name, 5)
        .then(c => [r.name, c])
        .catch(() => [r.name, []])
    )).then(pairs => {
      if (!cancelled) setCommitsByRepo(Object.fromEntries(pairs))
    })
    return () => { cancelled = true }
  }, [token, owner, repos])

  // Every update across every project, newest activity first.
  const allUpdates = []
  if (owner) {
    for (const r of repos) {
      for (const u of getUpdates(ownerOf(r, owner), r.name) || []) {
        allUpdates.push({ ...u, repoName: r.name, repoOwner: ownerOf(r, owner) })
      }
    }
  }
  allUpdates.sort((a, b) => new Date(b.lastActivityAt || 0) - new Date(a.lastActivityAt || 0))

  // The hero is one update — the most recently active one still in flight.
  let heroUpdate = null
  let heroRepo = null
  let heroOwner = null
  if (owner) {
    for (const r of repos) {
      const rOwner = ownerOf(r, owner)
      const active = getActiveUpdate(rOwner, r.name)
      if (active && (!heroUpdate || new Date(active.lastActivityAt || 0) > new Date(heroUpdate.lastActivityAt || 0))) {
        heroUpdate = active
        heroRepo = r.name
        heroOwner = rOwner
      }
    }
  }

  const hero = heroUpdate
    ? heroFor(heroUpdate, { filesCount: (heroUpdate.files || []).length })
    : null

  const mostRecent = owner
    ? [...repos].sort((a, b) => {
        const at = getMemory(ownerOf(a, owner), a.name).lastOpenedAt || a.updated_at || 0
        const bt = getMemory(ownerOf(b, owner), b.name).lastOpenedAt || b.updated_at || 0
        return new Date(bt) - new Date(at)
      })[0]
    : repos[0]

  const updateCount = allUpdates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  // The inbox is deliberately narrow: only work that needs a human decision
  // belongs here. "Sent to AI" is waiting on somebody else, not an action the
  // person can take now. This keeps a dashboard from becoming a noisy list of
  // every update that happens to exist.
  const inboxUpdates = allUpdates
    .filter(u => ['changes_detected', 'waiting_for_review', 'ready_to_save', 'needs_correction'].includes(u.status))
    .slice(0, 3)

  const events = activityEvents({ owner, repos, commitsByRepo })

  const dismissExplainer = () => {
    try {
      localStorage.setItem(EXPLAINER_DISMISSED_KEY, 'true')
      setExplainerDismissed(true)
    } catch { /* preference just won't persist */ }
  }

  /* ── First run: nothing in GitHub yet ──────────────────────────────────
     The dashboard below answers "where did I leave off". Someone signing in
     for the first time has no answer to that, and four empty panels plus a
     tick reading "everything is saved in GitHub" is worse than nothing — it
     reassures them about work that does not exist. One screen, one action.

     An error is not emptiness: if GitHub could not be reached, repos is also
     empty, and this screen would tell someone with a hundred projects that
     they have none. So it only appears when the list genuinely came back. */
  if (!loading && !error && repos.length === 0) {
    return (
      <div className="screen-padded firstrun-screen">
        <StorkDelivery variant="connected" />
        <h1 className="firstrun-title">Welcome{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="firstrun-lead">
          You're signed in, and there's nothing in your account yet. That's the right
          place to be starting from.
        </p>

        <section className="firstrun-card">
          <div className="firstrun-card-label">Start here</div>
          <h2 className="firstrun-card-title">{onboardingCopy?.title || 'Make your first project'}</h2>
          <p className="firstrun-card-body">
            {onboardingCopy?.body || 'A project is one place for everything that belongs together — an app, a book, or a client job. Yourkly keeps GitHub underneath so you can work in project language.'}
          </p>
          <Link to="/new" className="pl-btn-primary firstrun-cta">{onboardingCopy?.cta || 'Make your first project'}</Link>
          <p className="firstrun-card-foot">
            It asks for a name and one sentence about what it's for. Nothing is visible to
            anyone else unless you choose that.
          </p>
        </section>

        <div className="firstrun-next">
          <div className="firstrun-next-label">Then what happens</div>
          <ol className="firstrun-steps">
            <li>You describe what you want to build, in your own words.</li>
            <li>You hand that to ChatGPT, Claude, Gemini, Manus or DeepSeek.</li>
            <li>You bring the work back here, read what changed, and save it.</li>
          </ol>
          <p className="firstrun-next-foot">
            Yourkly is the part that remembers all of it — which is the part no single AI
            tool can do for you.{' '}
            <Link to="/help/how-it-works" className="text-link">How Yourkly works</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen-padded home-screen">
      {/* 1. Greeting */}
      <div className="home-header">
        <div>
          <h1 className="home-greeting">
            {greeting()}{firstName ? `, ${firstName}` : ''}.
          </h1>
          <p className="home-subtitle">
            Here's where you left off, what changed, and what to do next.
          </p>
        </div>
        <Link to="/projects" className="pl-btn home-all-projects">All projects</Link>
      </div>

      {/* 2. Dismissible explainer */}
      {!explainerDismissed && (
        <section className="home-explainer">
          <div>
            <p className="home-explainer-title">New here? This is what Yourkly does.</p>
            <p className="home-explainer-body">
              Your work lives in GitHub. Yourkly is the front door: it remembers where you stopped,
              explains what changed in normal words, and keeps a Save Point every time you save so
              you can always go back.
            </p>
          </div>
          <button className="home-explainer-dismiss" onClick={dismissExplainer}>Got it</button>
        </section>
      )}

      {/* 3. Continue where you left off */}
      <div className="section-label">Continue where you left off</div>
      {heroUpdate && hero ? (
        <section className="home-hero-card">
          <div className="home-hero-context">
            <span className="home-hero-project">{projectName(heroRepo)}</span>
            <span className="home-hero-separator">·</span>
            <span className="home-hero-label">Update</span>
            <span className={`pl-pill pl-pill--${heroUpdate.status}`}>
              {STATUS_LABEL[heroUpdate.status]}
            </span>
          </div>
          <h2 className="home-hero-title">{heroUpdate.title}</h2>
          {heroUpdate.goal && <p className="home-hero-goal">{heroUpdate.goal}</p>}

          <div className="home-hero-panel">
            <div className="home-hero-row">
              <span className="home-hero-row-label">Where you left off</span>
              <span className="home-hero-row-value">{hero.left}</span>
            </div>
            <div className="home-hero-row">
              <span className="home-hero-row-label">What's happened since</span>
              <span className="home-hero-row-value">{hero.since}</span>
            </div>
            <div className="home-hero-row">
              <span className="home-hero-row-label home-hero-row-label--next">What to do next</span>
              <span className="home-hero-row-value home-hero-row-value--next">{hero.next}</span>
            </div>
          </div>

          <div className="home-hero-actions">
            <button
              className="pl-btn-primary home-hero-cta"
              onClick={() => navigate(`/p/${heroOwner}/${heroRepo}/u/${heroUpdate.id}/${hero.route}`)}
            >
              {hero.cta}
            </button>
            <Link to={`/p/${heroOwner}/${heroRepo}/u/${heroUpdate.id}`} className="pl-btn">Open the update</Link>
            <Link to={`/p/${heroOwner}/${heroRepo}/updates`} className="pl-btn">Something else</Link>
          </div>
        </section>
      ) : (
        <section className="home-hero-card home-hero-empty">
          {mostRecent && (
            <div className="home-hero-context">
              <span className="home-hero-project">{projectName(mostRecent.name)}</span>
              <span className="home-hero-separator">·</span>
              <span className="home-hero-label">Most recent project</span>
            </div>
          )}
          <p className="home-hero-empty-title">You haven't started an update yet.</p>
          <p className="home-hero-empty-next">Describe what you want to change.</p>
          <div className="home-hero-actions">
            <Link
              to={mostRecent ? `/p/${ownerOf(mostRecent, owner)}/${mostRecent.name}/new-update` : '/projects'}
              className="pl-btn-primary home-hero-cta"
            >
              Make an update
            </Link>
            {mostRecent && (
              <Link to={`/p/${ownerOf(mostRecent, owner)}/${mostRecent.name}`} className="pl-btn">
                Open {projectName(mostRecent.name)}
              </Link>
            )}
          </div>
        </section>
      )}

      {/* 4. AI Change Inbox */}
      <div className="section-label">AI change inbox</div>
      {inboxUpdates.length ? (
        <section className="home-inbox">
          <div className="home-inbox-head">
            <div>
              <h2>Work is waiting on you</h2>
              <p>Review it, ask for a correction, or save it. Nothing moves forward without you.</p>
            </div>
            {inboxUpdates.length > 1 && <Link to="/activity" className="text-link">See all activity</Link>}
          </div>
          <div className="home-inbox-list">
            {inboxUpdates.map(update => {
              const next = heroFor(update, { filesCount: (update.files || []).length })
              return (
                <div className="home-inbox-row" key={`${update.repoOwner}/${update.repoName}/${update.id}`}>
                  <div className="home-inbox-copy">
                    <div className="home-inbox-meta">
                      <span>{projectName(update.repoName)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{timeAgo(update.lastActivityAt)}</span>
                    </div>
                    <div className="home-inbox-title">{update.title}</div>
                    <div className="home-inbox-next">{next.next}</div>
                  </div>
                  <Link
                    to={`/p/${update.repoOwner}/${update.repoName}/u/${update.id}/${next.route}`}
                    className="pl-btn-primary home-inbox-cta"
                  >
                    {next.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="home-attention-none">
          <span className="home-attention-tick" aria-hidden="true">✓</span>
          <span>Nothing is waiting on you right now. Everything Yourkly knows about is saved or in progress.</span>
        </div>
      )}

      {/* 5. Recent projects + recent activity */}
      <div className="home-columns">
        <div>
          <div className="home-column-head">
            <div className="section-label section-label--tight">Recent projects</div>
            <Link to="/projects" className="text-link">See all</Link>
          </div>
          {loading && <p className="state-loading">Getting your projects from GitHub…</p>}
          {!loading && repos.length === 0 && (
            <p className="home-empty-note">No projects yet. Start one and it shows up here.</p>
          )}
          <div className="home-project-list">
            {repos.slice(0, 4).map(repo => {
              const mem = owner ? getMemory(ownerOf(repo, owner), repo.name) : {}
              const status = projectStatus(
                owner ? getUpdates(ownerOf(repo, owner), repo.name) : [],
                owner ? getDrafts(ownerOf(repo, owner), repo.name) : {}
              )
              const lastAction = mem.lastSaveLabel
                ? `Last Save Point: ${mem.lastSaveLabel}`
                : mem.lastOpenedAt
                  ? `Opened ${timeAgo(mem.lastOpenedAt)}`
                  : `Last touched ${timeAgo(repo.updated_at)}`
              return (
                <Link key={repo.id || repo.name} to={`/p/${ownerOf(repo, owner)}/${repo.name}`} className="home-project-card">
                  <span className="home-project-body">
                    <span className="home-project-top">
                      <span className="home-project-name">{projectName(repo.name)}</span>
                      {status && (
                        <span className={`pl-pill pl-pill--${status.tone}`}>{status.label}</span>
                      )}
                    </span>
                    <span className="home-project-desc">
                      {repo.description || 'No description yet — you can add one in project settings.'}
                    </span>
                    <span className="home-project-action">{lastAction}</span>
                    <span className="home-project-url">github.com/{ownerOf(repo, owner)}/{repo.name}</span>
                  </span>
                  <span className="home-project-chevron" aria-hidden="true">›</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <div className="section-label section-label--tight">Recent activity</div>
          <div className="home-activity">
            {events.length === 0 && (
              <p className="home-empty-note">
                Nothing yet. Anything you or an AI does shows up here.
              </p>
            )}
            {events.slice(0, 5).map((e, i) => (
              <div key={`${e.repo}-${e.at}-${i}`} className="home-activity-row">
                <span className="home-activity-dot" aria-hidden="true" />
                <span>
                  <span className="home-activity-what">{e.what}</span>
                  <span className="home-activity-meta">
                    {projectName(e.repo)} · {timeAgo(e.at)}
                  </span>
                </span>
              </div>
            ))}
            <Link to="/activity" className="text-link home-activity-all">See all activity</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
