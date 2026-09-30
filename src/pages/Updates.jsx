/**
 * Updates.jsx — /p/:repo/updates (max-width 860px)
 *
 * Two lists, and the difference between them is the point.
 *
 * An **update** is something Yourkly followed from beginning to end: you
 * described it, it went to an AI, changes came back, you reviewed and saved.
 * A **Save Point** is something GitHub recorded, however it got there.
 *
 * Most work arrives the second way. Listing only the first left this screen
 * empty for projects that had been worked on all week, so the Save Points are
 * here too — underneath, named for what they are, never counted as updates.
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCommits, getSavePointCount } from '../api/github'
import { getUpdates, STATUS_LABEL } from '../utils/updateMemory'
import { heroFor } from '../utils/heroFor'
import { timeAgo } from '../utils/time'
import { splitCommitMessage, commitAuthor } from '../utils/commitText'
import { projectName } from '../utils/projectName'

export default function Updates({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth
  const updates = owner ? getUpdates(owner, repo) : []
  const inProgressCount = updates.filter(u => u.status !== 'saved' && u.status !== 'paused').length

  const [saved, setSaved] = useState([])
  const [total, setTotal] = useState(null)
  const [loadingSaved, setLoadingSaved] = useState(true)

  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    getCommits(token, owner, repo, 10)
      .then(c => { if (!cancelled) setSaved(c || []) })
      .catch(() => { if (!cancelled) setSaved([]) })
      .finally(() => { if (!cancelled) setLoadingSaved(false) })
    getSavePointCount(token, owner, repo).then(n => { if (!cancelled) setTotal(n) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  return (
    <div className="screen-padded updates-screen">
      <div>
        <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>

        <div className="updates-header">
          <h1>Updates</h1>
          <Link to={`/p/${owner}/${repo}/new-update`} className="pl-btn-primary">
            Make an update
          </Link>
        </div>

        <p className="updates-intro-text">
          An update is one thing you want to change, described in your words. Yourkly keeps track
          of what it touched, which AI worked on it, and whether it's saved.{' '}
          {inProgressCount} {inProgressCount === 1 ? 'update' : 'updates'} in progress.
        </p>

        {updates.length === 0 && (
          <div className="updates-empty">
            <p>
              No updates yet — nothing has been followed start to finish inside Yourkly. Work
              already saved to GitHub is below.
            </p>
            <Link to={`/p/${owner}/${repo}/new-update`} className="pl-btn-primary">
              Make an update
            </Link>
          </div>
        )}

        {updates.length > 0 && (
          <div className="updates-list">
            {updates.map(u => {
              const hero = heroFor(u, { filesCount: (u.files || []).length })
              return (
                <Link key={u.id} to={`/p/${owner}/${repo}/u/${u.id}`} className="updates-row">
                  <div className="updates-row-main">
                    <div className="updates-row-header">
                      <h2 className="updates-row-title">{u.title}</h2>
                      <span className={`pl-pill pl-pill--${u.status}`}>
                        {STATUS_LABEL[u.status]}
                      </span>
                    </div>
                    {u.goal && <p className="updates-row-goal">{u.goal}</p>}
                    <p className="updates-row-meta">
                      {u.ai && <>Worked on with <strong>{u.ai}</strong> · </>}
                      {(u.files || []).length === 1 ? '1 file affected' : `${(u.files || []).length} files affected`}
                      {' '}· Last activity {timeAgo(u.lastActivityAt)}
                    </p>
                  </div>
                  <div className="updates-row-next">
                    <p className="updates-row-next-label">Next step</p>
                    <p className="updates-row-next-text">{hero.next}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Work that reached GitHub some other way ─────────────────────── */}
        <div className="section-label updates-saved-label">Saved to GitHub</div>
        <p className="updates-saved-intro">
          Every change already saved in this project, newest first — including work done outside
          Yourkly.
        </p>

        {loadingSaved && <p className="state-loading">Getting your Save Points from GitHub…</p>}

        {!loadingSaved && saved.length === 0 && (
          <p className="updates-saved-empty">
            Nothing saved in this project yet. The first time you save, it shows up here.
          </p>
        )}

        {saved.length > 0 && (
          <>
            <div className="changed-list">
              {saved.map((c, i) => {
                const { title, summary } = splitCommitMessage(c.commit?.message)
                const version = total ? total - i : null
                return (
                  <div key={c.sha} className="changed-entry">
                    <div className="changed-entry-text">
                      <div className="changed-entry-title">{title}</div>
                      {summary && <div className="changed-entry-summary">{summary}</div>}
                      <div className="changed-entry-meta">
                        {commitAuthor(c, user?.login)}
                        {c.commit?.author?.date && <> · {timeAgo(c.commit.author.date)}</>}
                        {version > 0 ? <> · v{version}</> : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Link to={`/p/${owner}/${repo}/changed`} className="text-link updates-saved-all">
              See everything that changed →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
