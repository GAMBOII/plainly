/**
 * ProjectHome.jsx — /p/:repo (max-width 880px)
 *
 * Where a project opens. Status row, the update you're in the middle of, then
 * everything else you might want to do (HANDOFF §7.3, screen "Project Home").
 *
 * The four sentences about the current update come from heroFor() — the same
 * function Home and the update workspace call, so the three screens can never
 * contradict each other (§6).
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRepoInfo, getCommits, getSavePointCount } from '../api/github'
import { getActiveUpdate, getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'
import { splitCommitMessage, commitAuthor } from '../utils/commitText'
import { projectName } from '../utils/projectName'
import { useShowGithubWords } from '../utils/settings'
import { aiRouteFor } from '../utils/aiRoute'
import ProjectSections from '../components/ProjectSections'
import StarButton from '../components/StarButton'
import ProjectHealth from '../components/ProjectHealth'

export default function ProjectHome({ auth }) {
  const { owner, repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth
  const [showWords] = useShowGithubWords()

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recent, setRecent] = useState([])    // real Save Points from GitHub
  const [total, setTotal] = useState(null)    // null = couldn't count

  useEffect(() => {
    if (!token || !owner) return
    setLoading(true)
    getRepoInfo(token, owner, repo)
      .then(r => setRepoData(r))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  // What has actually happened in this project. Yourkly only knows about the
  // updates it created itself, and most work arrives some other way — pushed
  // from an editor, from an AI tool, from another machine. Without this the
  // screen says "you haven't started an update" to someone who has been
  // working all week.
  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    getCommits(token, owner, repo, 3)
      .then(c => { if (!cancelled) setRecent(c || []) })
      .catch(() => { if (!cancelled) setRecent([]) })
    getSavePointCount(token, owner, repo)
      .then(n => { if (!cancelled) setTotal(n) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  const projectTitle = projectName(repo)
  const activeUpdate = owner ? getActiveUpdate(owner, repo) : null
  const allUpdates = owner ? getUpdates(owner, repo) : []
  const inProgressCount = allUpdates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  const hero = activeUpdate
    ? heroFor(activeUpdate, { filesCount: (activeUpdate.files || []).length })
    : null

  // "Changes not saved yet" is only true when an update has been reviewed and
  // is waiting to be saved. Anything else and Yourkly says nothing.
  const unsaved = allUpdates.some(u => u.status === 'ready_to_save')

  // Continue with AI opens for the update in progress, or for the project
  // itself when there isn't one. Shared with the sidebar so the two can't
  // disagree about where the same words lead.
  const aiRoute = aiRouteFor(owner, repo, activeUpdate)

  const ACTIONS = [
    { title: 'Make an update',            body: "Describe what you want to change. You don't need to know which file controls it.", cta: 'Describe an update', to: `/p/${owner}/${repo}/new-update` },
    { title: 'Continue in…',              body: 'Pick Lovable, ChatGPT, Claude, Cursor, VS Code, or another tool. Yourkly prepares the context it needs.', cta: 'Continue in…', to: aiRoute },
    { title: 'Things to do',              body: "What still needs doing. Kept in GitHub, so it's there on any computer and anyone you share with can see it.", cta: 'Open the list', to: `/p/${owner}/${repo}/todo` },
    { title: 'Review what changed',       body: 'See recent Save Points and understand what each one changed.', cta: 'View changes', to: `/p/${owner}/${repo}/changed` },
    { title: 'Put it on the web',         body: 'Give this project a web address anyone can open. Every save republishes it.', cta: 'Publish it', to: `/p/${owner}/${repo}/publish` },
    { title: 'Browse project files',      body: 'Open and edit the files stored in this GitHub project.', cta: 'Browse files', to: `/p/${owner}/${repo}/files` },
    { title: 'Restore an earlier version', body: 'Go back to a previous Save Point. Nothing newer is deleted.', cta: 'View Save Points', to: `/p/${owner}/${repo}/points` },
  ]

  if (loading) {
    return (
      <div className="screen-padded project-screen">
        <p className="state-loading">Getting this project from GitHub…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="screen-padded project-screen">
        <p className="error-box">{error}</p>
      </div>
    )
  }

  return (
    <div className="screen-padded project-screen">
      <Link to="/" className="back-link">← Home</Link>

      <div className="project-head" style={{ viewTransitionName: `project-${repo.replace(/[^a-zA-Z0-9_-]/g, '-')}` }}>
        <h1 className="project-title">{projectTitle}</h1>
        <StarButton auth={auth} owner={owner} repo={repo} count={repoData?.stargazers_count} />
      </div>
      {repoData?.description && <p className="project-desc">{repoData.description}</p>}

      {/* Status row — every value here comes from GitHub or stored memory. */}
      <div className="project-status">
        <a
          className="project-status-url"
          href={repoData?.html_url || `https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noreferrer"
        >
          github.com/{owner}/{repo}
        </a>
        <span className="project-status-sep" aria-hidden="true">|</span>
        <span className="project-status-ok">GitHub connected</span>
        <span className="project-status-sep" aria-hidden="true">|</span>
        <span>
          Main version
          {/* v18 means the 18th Save Point GitHub currently lists. Counted, not
              stored — and simply absent when the count couldn't be made. */}
          {total ? <> · v{total}</> : null}
          {showWords && repoData?.default_branch && (
            <span className="project-status-github"> ({repoData.default_branch})</span>
          )}
        </span>
        {repoData?.pushed_at && (
          <>
            <span className="project-status-sep" aria-hidden="true">|</span>
            <span>Last Save Point {timeAgo(repoData.pushed_at)}</span>
          </>
        )}
        <span className="project-status-sep" aria-hidden="true">|</span>
        {unsaved
          ? <span className="project-status-unsaved">Changes not saved yet</span>
          : <span className="project-status-ok">Everything saved</span>}
      </div>

      <ProjectHealth
        auth={auth}
        owner={owner}
        repo={repo}
        updates={allUpdates}
        unsaved={unsaved}
      />

      {/* Current update */}
      {activeUpdate && hero ? (
        <>
          <div className="section-label">Current update</div>
          <section className="project-update-card">
            <div className="project-update-head">
              <h2 className="project-update-name">{activeUpdate.title}</h2>
              <span className={`pl-pill pl-pill--${activeUpdate.status}`}>
                {STATUS_LABEL[activeUpdate.status]}
              </span>
            </div>
            {activeUpdate.goal && <p className="project-update-goal">{activeUpdate.goal}</p>}

            <div className="project-update-facts">
              {activeUpdate.ai && (
                <span>Worked on with <strong>{activeUpdate.ai}</strong></span>
              )}
              <span>
                {(activeUpdate.files || []).length === 1
                  ? '1 file affected'
                  : `${(activeUpdate.files || []).length} files affected`}
              </span>
              {activeUpdate.lastActivityAt && (
                <span>Last activity {timeAgo(activeUpdate.lastActivityAt)}</span>
              )}
            </div>

            <div className="project-update-actions">
              <button
                className="pl-btn-primary"
                onClick={() => navigate(`/p/${owner}/${repo}/u/${activeUpdate.id}/${hero.route}`)}
              >
                {hero.cta}
              </button>
              <Link to={`/p/${owner}/${repo}/u/${activeUpdate.id}`} className="pl-btn">
                Open the update
              </Link>
              {inProgressCount > 1 && (
                <Link to={`/p/${owner}/${repo}/updates`} className="text-link">
                  {inProgressCount} updates in progress →
                </Link>
              )}
            </div>
          </section>
        </>
      ) : recent.length > 0 ? (
        /* No update of Yourkly's own, but the project has real history. Show
           what actually happened rather than a sentence about nothing. These
           are Save Points, and they say so — an update is a different thing,
           with a lifecycle Yourkly watched. */
        <>
          <div className="section-label">Recently saved to GitHub</div>
          <section className="project-update-card">
            <div className="project-recent-list">
              {recent.map((c, i) => {
                const { title, summary } = splitCommitMessage(c.commit?.message)
                const version = total ? total - i : null
                return (
                  <div key={c.sha} className="project-recent-row">
                    <div className="project-recent-title">{title}</div>
                    {summary && <div className="project-recent-summary">{summary}</div>}
                    <div className="project-recent-meta">
                      {commitAuthor(c, user?.login)}
                      {c.commit?.author?.date && <> · {timeAgo(c.commit.author.date)}</>}
                      {version > 0 ? <> · v{version}</> : null}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="project-recent-note">
              This is work already saved in GitHub. Start an update when you want Yourkly to
              follow a change from beginning to end.
            </p>

            <div className="project-update-actions">
              <Link to={`/p/${owner}/${repo}/new-update`} className="pl-btn-primary">Make an update</Link>
              <Link to={`/p/${owner}/${repo}/changed`} className="text-link">
                See everything that changed →
              </Link>
            </div>
          </section>
        </>
      ) : (
        <section className="project-update-card project-update-card--empty">
          <p className="project-update-empty-title">You haven't started an update yet.</p>
          <p className="project-update-empty-next">Describe what you want to change.</p>
          <Link to={`/p/${owner}/${repo}/new-update`} className="pl-btn-primary">Make an update</Link>
        </section>
      )}

      {/* Phones only — the sidebar's project list, since there is no sidebar. */}
      <ProjectSections owner={owner} repo={repo} activeUpdate={activeUpdate} />

      {/* Everything else */}
      <h2 className="project-else-title">Or do something else</h2>
      <p className="project-else-sub">Pick one. You can always come back here.</p>
      <div className="project-actions">
        {ACTIONS.map(a => (
          <Link key={a.title} to={a.to} className="project-action">
            <span className="project-action-text">
              <span className="project-action-title">{a.title}</span>
              <span className="project-action-body">{a.body}</span>
            </span>
            <span className="project-action-cta">{a.cta}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
