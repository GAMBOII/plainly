/**
 * ReviewAIChanges.jsx — /p/:repo/u/:updateId/review (max-width 840px)
 *
 * What the AI changed, in plain English first (HANDOFF §7.9). Technical detail
 * is never the default view — it sits behind "Show technical details".
 *
 * Project check is [REQUIRES BACKEND]: only "files you did not ask about" can
 * be computed today, so the rest say so and the card carries the dashed badge.
 * Nothing here prints "Yes" for a build that was never run.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate } from '../utils/updateMemory'
import { getCurrentHeadSha, compareCommits, getCheckRuns } from '../api/github'

const NOT_CHECKED = 'Not checked — Yourkly cannot run this yet.'

export default function ReviewAIChanges({ auth }) {
  const { owner, repo, updateId } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth

  const update = owner ? getUpdateById(owner, repo, updateId) : null

  const [diff, setDiff]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [showTech, setShowTech] = useState(false)

  useEffect(() => {
    if (!token || !owner || !update) return
    let cancelled = false
    const sentSha = update.handoff?.commitShaAtSend

    async function load() {
      try {
        const head = await getCurrentHeadSha(token, owner, repo)
        if (!sentSha) {
          if (!cancelled) { setDiff(null); setLoading(false) }
          return
        }
        const d = await compareCommits(token, owner, repo, sentSha, head)
        if (!cancelled) { setDiff({ ...d, head }); setLoading(false) }
      } catch {
        if (!cancelled) { setError('Yourkly could not read the changes from GitHub.'); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, owner, repo, update?.handoff?.commitShaAtSend])

  if (!update) {
    return (
      <div className="screen-padded review-screen">
        <p className="error-box">Update not found.</p>
        <Link to={`/p/${owner}/${repo}/updates`} className="pl-btn">Back to updates</Link>
      </div>
    )
  }

  const ai = update.ai || 'the AI'
  const changedFiles = (diff?.files || []).map(f => f.filename)
  const asked = new Set(update.files || [])
  const unexpected = changedFiles.filter(f => asked.size > 0 && !asked.has(f))

  const summary = diff
    ? `${diff.filesChanged} ${diff.filesChanged === 1 ? 'file' : 'files'} changed across ` +
      `${diff.commitCount} ${diff.commitCount === 1 ? 'Save Point' : 'Save Points'}` +
      (changedFiles.length ? `: ${changedFiles.join(', ')}.` : '.')
    : 'Yourkly has nothing to compare against — this update was never marked as sent.'

  function accept() {
    updateUpdate(owner, repo, updateId, {
      status: 'ready_to_save',
      files: changedFiles.length ? changedFiles : update.files,
      storyEntry: 'You reviewed and accepted the changes',
    })
    navigate(`/p/${owner}/${repo}/save`)
  }

  function askForFix() {
    updateUpdate(owner, repo, updateId, {
      status: 'needs_correction',
      storyEntry: 'You asked the AI to fix something',
    })
    navigate(`/p/${owner}/${repo}/u/${updateId}/ai`)
  }

  // What GitHub's own automatic checks say about the newest Save Point.
  // `{ total: 0 }` means no checks are set up, which is not the same as
  // passing — it must never draw a tick.
  const [checks, setChecks] = useState(undefined)
  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    getCurrentHeadSha(token, owner, repo)
      .then(sha => getCheckRuns(token, owner, repo, sha))
      .then(r => { if (!cancelled) setChecks(r) })
      .catch(() => { if (!cancelled) setChecks(null) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  const failed = (checks?.runs || []).filter(r =>
    r.status === 'completed' && !['success', 'neutral', 'skipped'].includes(r.conclusion))
  const running = (checks?.runs || []).filter(r => r.status !== 'completed')

  const buildCheck =
    checks === undefined ? { result: 'Asking GitHub…', ok: null }
    : checks === null     ? { result: "Yourkly couldn't ask GitHub.", ok: null }
    : checks.total === 0  ? { result: 'This project has no automatic checks set up.', ok: null }
    : running.length      ? { result: `${running.length} still running.`, ok: null }
    : failed.length       ? { result: `${failed.length} of ${checks.total} failed — ${failed.map(f => f.name).join(', ')}`, ok: false }
    :                       { result: `All ${checks.total} passed.`, ok: true }

  const CHECKS = [
    { label: 'GitHub\'s automatic checks', result: buildCheck.result, ok: buildCheck.ok },
    {
      label: 'Files you did not ask about',
      result: asked.size === 0
        ? 'This update has no file list to compare against.'
        : unexpected.length
          ? `${unexpected.length} — ${unexpected.join(', ')}`
          : 'None',
      ok: asked.size > 0 ? unexpected.length === 0 : null,
    },
  ]

  return (
    <div className="screen-padded review-screen">
      <Link to={`/p/${owner}/${repo}/u/${updateId}`} className="back-link">← {update.title}</Link>
      <h1 className="review-title">What {ai} changed</h1>
      <p className="review-intro">
        In plain English first. Nothing here is saved to GitHub until you choose to save it.
      </p>

      {loading && <p className="state-loading">Reading the changes from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && (
        <>
          <div className="review-card">
            <div className="section-label">What you asked for</div>
            <p className="review-card-text">{update.goal || update.title}</p>
          </div>

          <div className="review-card">
            <div className="section-label">What changed</div>
            <p className="review-card-text">{summary}</p>
          </div>

          <div className="review-card review-card--amber">
            <div className="section-label review-label--amber">What else changed</div>
            <p className="review-card-text">
              {unexpected.length
                ? `${unexpected.join(', ')} — you did not ask for ${unexpected.length === 1 ? 'this one' : 'these'}. Worth a look.`
                : 'Nothing else was touched.'}
            </p>
          </div>

          <div className="review-card">
            <div className="review-card-head">
              <div className="section-label section-label--tight">Project check</div>
            </div>
            <div className="review-checks">
              {CHECKS.map(c => (
                <div key={c.label} className="review-check">
                  <span className={`review-check-mark${c.ok === true ? ' is-ok' : c.ok === false ? ' is-bad' : ' is-unknown'}`}>
                    {c.ok === true ? '✓' : c.ok === false ? '!' : '–'}
                  </span>
                  <span className="review-check-label">{c.label}</span>
                  <span className="review-check-result">{c.result}</span>
                </div>
              ))}
            </div>
            <p className="review-check-scope">
              Yourkly reports what GitHub's own checks say. It does not read the changes
              itself, so it can't tell you whether a password was added or a link goes
              nowhere — read the changes above for that.
            </p>
          </div>

          <div className="review-card">
            <div className="review-card-head">
              <div className="section-label section-label--tight">Files affected</div>
              <button className="text-link" onClick={() => setShowTech(!showTech)}>
                {showTech ? 'Hide technical details' : 'Show technical details'}
              </button>
            </div>
            <div className="review-files">
              {changedFiles.length
                ? changedFiles.map(f => <span key={f} className="review-file-chip">{f}</span>)
                : <span className="review-card-text">No files to show.</span>}
            </div>
            {showTech && diff && (
              <div className="review-tech">
                <div>
                  commit {String(diff.head || '').slice(0, 7)} · {diff.commitCount}{' '}
                  {diff.commitCount === 1 ? 'Save Point' : 'Save Points'} since your handoff
                </div>
                <div>
                  {(diff.files || [])
                    .map(f => `${f.filename} +${f.additions} −${f.deletions}`)
                    .join(' · ') || 'no file detail returned'}
                </div>
                <div>
                  {(diff.commits || [])
                    .map(c => `${c.author?.login || c.commit?.author?.name || 'unknown'} · ${c.commit?.author?.date || ''}`)
                    .join(' · ')}
                </div>
              </div>
            )}
          </div>

          <h2 className="review-choices-title">What do you want to do?</h2>
          <div className="review-choices">
            <div className="review-choice">
              <div className="review-choice-text">
                <div className="review-choice-name">Accept and save</div>
                <div className="review-choice-body">
                  Create a Save Point in GitHub with these changes. Recommended.
                </div>
              </div>
              <button className="pl-btn-primary review-choice-cta" onClick={accept}>
                Accept and save
              </button>
            </div>

            <div className="review-choice">
              <div className="review-choice-text">
                <div className="review-choice-name">Ask the AI to fix something</div>
                <div className="review-choice-body">
                  Yourkly writes a follow-up handoff that includes what it got wrong.
                </div>
              </div>
              <button className="pl-btn review-choice-cta" onClick={askForFix}>
                Write a follow-up
              </button>
            </div>

            <div className="review-choice">
              <div className="review-choice-text">
                <div className="review-choice-name">Change it myself first</div>
                <div className="review-choice-body">Open the files and edit before saving.</div>
              </div>
              <Link to={`/p/${owner}/${repo}/files`} className="pl-btn review-choice-cta">Open the files</Link>
            </div>

            <div className="review-choice">
              <div className="review-choice-text">
                <div className="review-choice-name">Undo all of it</div>
                <div className="review-choice-body">
                  Go back to how the project was before this update. Nothing is deleted — the
                  AI's version stays in your history.
                </div>
              </div>
              <Link to={`/p/${owner}/${repo}/points`} className="pl-btn review-choice-cta">
                Restore earlier version
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
