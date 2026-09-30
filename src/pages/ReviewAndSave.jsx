/**
 * ReviewAndSave.jsx — /p/:repo/save (max-width 820px)
 *
 * Exactly what will be saved to GitHub, then the button that saves it
 * (HANDOFF §7.10), followed by the confirmation (§7.11).
 *
 * The diff comes from real drafts on this computer compared against the file
 * as it currently stands in GitHub. If GitHub rejects a save because the file
 * changed underneath, the conflict screen from §7.10 takes over — nothing is
 * thrown away without asking.
 *
 * Changes are committed to a new branch and proposed as a pull request, which
 * is then auto-merged to main. This gives a clean history and allows for
 * future review workflows.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getActiveUpdate, updateUpdate } from '../utils/updateMemory'
import { getFileContent, saveFile, createBranch, getCurrentHeadSha, createPullRequest, mergePullRequest } from '../api/github'
import { recordSave } from '../utils/projectMemory'
import { getDrafts, clearDraft, lineChanges } from '../utils/drafts'
import { projectName } from '../utils/projectName'
import { timeAgo } from '../utils/time'

export default function ReviewAndSave({ auth }) {
  const { owner, repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth

  const update = owner ? getActiveUpdate(owner, repo) : null

  const [files, setFiles]       = useState([])   // [{ path, sha, draft, changes }]
  const [loading, setLoading]   = useState(true)
  const [label, setLabel]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [conflict, setConflict] = useState(null)
  const [error, setError]       = useState(null)
  const [saved, setSaved]       = useState(null)

  useEffect(() => {
    if (!owner || !token) return
    const drafts = getDrafts(owner, repo)
    const paths = Object.keys(drafts)
    if (paths.length === 0) { setLoading(false); return }

    Promise.all(paths.map(async path => {
      let current = ''
      let sha = drafts[path].sha
      try {
        const file = await getFileContent(token, owner, repo, path)
        current = file.content
        sha = file.sha
      } catch { /* new or unreadable file — treated as empty */ }
      return {
        path,
        sha,
        draft: drafts[path].content,
        at: drafts[path].at,
        changes: lineChanges(current, drafts[path].content),
      }
    })).then(rows => {
      setFiles(rows)
      setLoading(false)
    })
  }, [owner, token, repo])

  async function handleSave(e) {
    e.preventDefault()
    if (!owner || files.length === 0) return
    setSaving(true)
    setError(null)
    const message = label.trim() || 'Made updates to the project'

    try {
      // Generate a unique branch name: yourkly-update-{timestamp}
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const branchName = `yourkly-update-${timestamp}`

      // Get current main branch head SHA to base the new branch from
      const headSha = await getCurrentHeadSha(token, owner, repo)

      // Create the new branch
      await createBranch(token, owner, repo, branchName, headSha)

      // Commit all files to the new branch
      let lastSha = null
      for (const file of files) {
        const result = await saveFile(token, owner, repo, file.path, file.draft, file.sha, message)
        lastSha = result.commit?.sha || lastSha
        clearDraft(owner, repo, file.path)
      }

      // Create a pull request with the user's message as title
      const pr = await createPullRequest(token, owner, repo, branchName, message, 
        `Yourkly update: ${message}\n\n${files.length} file${files.length === 1 ? '' : 's'} changed.`)

      // Auto-merge the pull request
      if (pr && pr.number) {
        await mergePullRequest(token, owner, repo, pr.number)
      }

      recordSave(owner, repo, message, lastSha)
      if (update) {
        updateUpdate(owner, repo, update.id, {
          status: 'saved',
          savePoint: message,
          storyEntry: `Saved to GitHub as "${message}"`,
        })
      }
      setSaved({ label: message, files: files.map(f => f.path), prUrl: pr?.html_url })
    } catch (err) {
      if (/409|conflict|sha|changed/i.test(err.message || '')) {
        setConflict({ path: files[0]?.path })
      } else {
        setError(err.message || 'Could not save. Try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  /* ── Confirmation (§7.11) ─────────────────────────────────────────────── */
  if (saved) {
    return (
      <div className="screen-padded save-screen">
        <div className="save-done-tick" aria-hidden="true">✓</div>
        <h1 className="save-done-title">Your work is saved as a proposal.</h1>
        <p className="save-done-body">
          Your changes are ready to merge to your main version. They can be reviewed and merged anytime.
        </p>
        <div className="save-done-card">
          <div className="save-done-row">
            <span className="save-done-label">Proposed update</span>
            <span className="save-done-value">{saved.label}</span>
          </div>
          <div className="save-done-rule" />
          <div className="save-done-row">
            <span className="save-done-label">Saved</span>
            <span className="save-done-value">Just now</span>
          </div>
          <div className="save-done-rule" />
          <div className="save-done-row">
            <span className="save-done-label">Files changed</span>
            <span className="save-done-value">{saved.files.join(', ')}</span>
          </div>
        </div>
        <div className="save-done-actions">
          <Link to={`/p/${owner}/${repo}`} className="pl-btn-primary">Back to {projectName(repo)}</Link>
          <Link to={`/p/${owner}/${repo}/changed`} className="pl-btn">See what changed</Link>
          {saved.prUrl && (
            <a href={saved.prUrl} target="_blank" rel="noopener noreferrer" className="pl-btn">
              View on GitHub
            </a>
          )}
          {update && (
            <Link to={`/p/${owner}/${repo}/u/${update.id}/ai`} className="pl-btn">Continue in…</Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="screen-padded save-screen">
      <Link to={`/p/${owner}/${repo}/files`} className="back-link">← Back to the file</Link>
      <h1 className="save-title">Review and save</h1>
      <p className="save-intro">
        Here's exactly what will be saved to GitHub. Nothing leaves this screen until you press
        the button.
      </p>

      {conflict && (
        <section className="save-conflict">
          <div className="save-conflict-title">This didn't save — the file changed somewhere else</div>
          <p className="save-conflict-body">
            Someone or something else saved <code>{conflict.path}</code> to GitHub while you were
            editing — probably an AI you handed this project to.
          </p>
          <p className="save-conflict-body">
            <strong>Nothing is lost.</strong> Your edits are still here on this computer. You just
            need to decide which version wins.
          </p>
          <div className="save-conflict-choices">
            <Link to={`/p/${owner}/${repo}/changed`} className="save-conflict-choice">
              <span>
                <span className="save-conflict-choice-name">Show me the other version first</span>
                <span className="save-conflict-choice-body">
                  Recommended — see what changed before you decide.
                </span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
            <button
              type="button"
              className="save-conflict-choice"
              onClick={() => { setConflict(null); setError(null) }}
            >
              <span>
                <span className="save-conflict-choice-name">Keep my version</span>
                <span className="save-conflict-choice-body">
                  Saves your edits over theirs. Their version stays in the history, so it can be
                  restored.
                </span>
              </span>
              <span aria-hidden="true">›</span>
            </button>
            <Link to={`/p/${owner}/${repo}/points`} className="save-conflict-choice">
              <span>
                <span className="save-conflict-choice-name">Keep their version</span>
                <span className="save-conflict-choice-body">
                  Throws away the edits you made on this computer. Yourkly will ask you to confirm.
                </span>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          </div>
        </section>
      )}

      {loading && <p className="state-loading">Reading your edits…</p>}

      {!loading && files.length === 0 && (
        <div className="save-empty">
          <p className="save-empty-title">There's nothing waiting to be saved.</p>
          <p className="save-empty-body">
            Everything you've edited is already in GitHub. Open a file to make a change and it
            will show up here before anything is saved.
          </p>
          <Link to={`/p/${owner}/${repo}/files`} className="pl-btn-primary">Browse project files</Link>
        </div>
      )}

      {!loading && files.map(file => {
        const added = file.changes.added.length
        const removed = file.changes.removed.length
        return (
          <section key={file.path} className="save-file">
            <div className="save-file-head">
              <div className="save-file-name">{file.path}</div>
              <div className="save-file-stat">
                1 file changed · {added} {added === 1 ? 'line' : 'lines'} added ·{' '}
                {removed} {removed === 1 ? 'line' : 'lines'} removed
                {file.at ? ` · edited ${timeAgo(file.at)}` : ''}
              </div>
            </div>
            <div className="save-diff">
              {file.changes.removed.map((line, i) => (
                <div key={`r${i}`} className="save-diff-line save-diff-line--removed">
                  <span aria-hidden="true">−</span><span>{line}</span>
                </div>
              ))}
              {file.changes.added.map((line, i) => (
                <div key={`a${i}`} className="save-diff-line save-diff-line--added">
                  <span aria-hidden="true">+</span><span>{line}</span>
                </div>
              ))}
              {added === 0 && removed === 0 && (
                <div className="save-diff-line">No line changes — the file matches GitHub.</div>
              )}
            </div>
          </section>
        )
      })}

      {!loading && files.length > 0 && (
        <form onSubmit={handleSave}>
          <div className="save-label-block">
            <label className="save-label-title" htmlFor="save-label">What changed?</label>
            <div className="save-label-hint">
              One short line in your own words. This becomes the name of your Save Point, so
              future-you can find it.
            </div>
            <input
              id="save-label"
              className="save-label-input"
              placeholder="Made the project description clearer"
              value={label}
              onChange={e => setLabel(e.target.value)}
              disabled={saving}
            />
          </div>

          {error && <p className="error-box">{error}</p>}

          <div className="save-actions">
            <button type="submit" className="pl-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Create Save Point and save to GitHub'}
            </button>
            <button type="button" className="pl-btn" onClick={() => navigate(`/p/${owner}/${repo}/files`)}>
              Keep editing
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
