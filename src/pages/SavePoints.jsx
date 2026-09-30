/**
 * SavePoints.jsx — /p/:repo/points (max-width 800px)
 *
 * Go back to an earlier version (HANDOFF §7.13).
 *
 * Restoring puts the files back as they were at that Save Point and saves that
 * as a *new* Save Point, so nothing newer is ever lost. Because that rewrites
 * real files, it asks first.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSavePointCount, getCommits, getCommitDetails, getFileAtCommit, getFileContent, saveFile } from '../api/github'
import { recordSave } from '../utils/projectMemory'
import { timeAgo, formatCommitLabel } from '../utils/time'
import { splitCommitMessage, commitAuthor } from '../utils/commitText'
import { projectName } from '../utils/projectName'

export default function SavePoints({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth

  const [commits, setCommits]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [confirming, setConfirming] = useState(null)  // sha awaiting confirmation
  const [working, setWorking]   = useState(false)
  const [restored, setRestored] = useState(null)      // { title, files }
  const [total, setTotal]       = useState(null)      // null = couldn't count

  useEffect(() => {
    if (!token || !owner) return
    getCommits(token, owner, repo, 30)
      .then(setCommits)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  // Only for the version numbers. Failing to count costs a "v18", not the page.
  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    getSavePointCount(token, owner, repo).then(n => { if (!cancelled) setTotal(n) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  async function restore(commit) {
    setWorking(true)
    setError(null)
    const title = formatCommitLabel((commit.commit?.message || '').split('\n')[0])
    try {
      const details = await getCommitDetails(token, owner, repo, commit.sha)
      const files = (details.files || []).filter(f => f.status !== 'removed')
      if (files.length === 0) throw new Error('That Save Point has no files Yourkly can put back.')

      const message = `Went back to "${title}"`
      let lastSha = null
      for (const file of files) {
        // The file as it was at that Save Point…
        const old = await getFileAtCommit(token, owner, repo, file.filename, commit.sha)
        // …written over what's there now, as a new Save Point.
        const now = await getFileContent(token, owner, repo, file.filename).catch(() => null)
        const result = await saveFile(
          token, owner, repo, file.filename, old.content, now?.sha, message
        )
        lastSha = result.commit?.sha || lastSha
      }
      recordSave(owner, repo, message, lastSha)
      setRestored({ title, files: files.map(f => f.filename) })
      setConfirming(null)
      const fresh = await getCommits(token, owner, repo, 30).catch(() => commits)
      setCommits(fresh)
    } catch (e) {
      setError(e.message || 'Could not put those files back.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="screen-padded points-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="points-title">Restore an earlier version</h1>
      <p className="points-intro">
        Pick the Save Point you want to go back to. Yourkly puts those files back and saves that
        as a new Save Point — so nothing newer is ever lost.
      </p>

      {restored && (
        <div className="points-restored">
          <span className="points-restored-tick" aria-hidden="true">✓</span>
          <div>
            <div>
              Restored — your files now look the way they did at "{restored.title}". This is saved
              as a new Save Point.
            </div>
            <Link to={`/p/${owner}/${repo}/files`} className="text-link">Open the file</Link>
          </div>
        </div>
      )}

      {loading && <p className="state-loading">Getting your Save Points from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}
      {!loading && !error && commits.length === 0 && (
        <p className="changed-empty">No Save Points yet, so there's nothing to go back to.</p>
      )}

      <div className="points-list">
        {commits.map((c, i) => {
          const { title } = splitCommitMessage(c.commit?.message)
          const who = commitAuthor(c, user?.login)
          const when = c.commit?.author?.date
          // Page one, newest first, so the top row is the latest Save Point.
          const version = total ? total - i : null
          return (
            <div key={c.sha} className="points-row">
              <div>
                <div className="points-row-title">{title}</div>
                <div className="points-row-meta">
                  {who} · {when ? timeAgo(when) : 'date unknown'}
                  {version > 0 ? <> · v{version}</> : null}
                </div>
              </div>
              {confirming === c.sha ? (
                <div className="points-confirm">
                  <span className="points-confirm-text">Put these files back?</span>
                  <button className="pl-btn-primary points-action" disabled={working} onClick={() => restore(c)}>
                    {working ? 'Putting them back…' : 'Yes, go back to this'}
                  </button>
                  <button className="pl-btn points-action" disabled={working} onClick={() => setConfirming(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="pl-btn points-action" onClick={() => setConfirming(c.sha)}>
                  Go back to this version
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
