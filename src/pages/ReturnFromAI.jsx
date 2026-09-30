/**
 * ReturnFromAI.jsx — /p/:repo/u/:updateId/return (max-width 860px)
 *
 * What happened while you were away (HANDOFF §7.8).
 *
 * Detection compares the branch head now against handoff.commitShaAtSend, and
 * tells Yourkly's own Save Points apart from anyone else's using the sha list
 * recorded at save time. Exactly one of five branches shows, and it is chosen
 * from real state — never from a flag. If a count can't be computed, the
 * "can't check" branch shows instead of a guess.
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUpdateById, updateUpdate } from '../utils/updateMemory'
import { getMemory } from '../utils/projectMemory'
import { getCurrentHeadSha, compareCommits } from '../api/github'

export default function ReturnFromAI({ auth }) {
  const { owner, repo, updateId } = useParams()
  const { token, user } = auth

  const update = owner ? getUpdateById(owner, repo, updateId) : null
  const sentSha = update?.handoff?.commitShaAtSend

  const [state, setState] = useState({ status: 'checking' })

  const check = useCallback(async () => {
    if (!token || !owner) return
    setState({ status: 'checking' })

    if (!sentSha) {
      setState({ status: 'nohandoff' })
      return
    }

    try {
      const head = await getCurrentHeadSha(token, owner, repo)
      if (head === sentSha) {
        setState({ status: 'none' })
        return
      }

      const diff = await compareCommits(token, owner, repo, sentSha, head)
      const mem = getMemory(owner, repo)
      const ours = new Set(mem.yourklySavedShas || [])
      const theirs = (diff.commits || []).filter(c => !ours.has(c.sha))
      const files = (diff.files || []).map(f => f.filename)

      // Local edits waiting to be saved + GitHub moved on = work from an old copy.
      if (update.status === 'ready_to_save' && theirs.length > 0) {
        setState({ status: 'newer', commits: theirs.length })
        return
      }

      if (theirs.length === 0) {
        setState({ status: 'none' })
        return
      }

      // Every new Save Point is somebody else's: the AI saved to GitHub itself.
      if (theirs.length === diff.commitCount) {
        setState({ status: 'external', commits: theirs.length, files })
      } else {
        setState({ status: 'changes', filesChanged: diff.filesChanged, files })
      }

      if (update.status !== 'changes_detected' && update.status !== 'waiting_for_review') {
        updateUpdate(owner, repo, updateId, {
          status: 'changes_detected',
          files: files.length ? files : update.files,
          storyEntry: `Yourk noticed ${diff.filesChanged} ${diff.filesChanged === 1 ? 'file' : 'files'} changed in GitHub`,
        })
      }
    } catch {
      setState({ status: 'offline' })
    }
  }, [token, owner, repo, updateId, sentSha, update?.status])

  useEffect(() => { check() }, [check])

  if (!update) {
    return (
      <div className="screen-padded return-screen">
        <p className="error-box">Update not found.</p>
        <Link to={`/p/${owner}/${repo}/updates`} className="pl-btn">Back to updates</Link>
      </div>
    )
  }

  const ai = update.ai || 'the AI'
  const reviewLink = `/p/${owner}/${repo}/u/${updateId}/review`

  return (
    <div className="screen-padded return-screen">
      <Link to={`/p/${owner}/${repo}/u/${updateId}`} className="back-link">← {update.title}</Link>

      <div className="return-head">
        <span className="section-label section-label--tight">Welcome back</span>
      </div>
      <h1 className="return-title">You continued this update with {ai}.</h1>
      <p className="return-subtitle">Yourk checked GitHub to see what happened while you were away.</p>

      {state.status === 'checking' && (
        <p className="state-loading">Checking GitHub for changes…</p>
      )}

      {/* 1. Changes detected */}
      {state.status === 'changes' && (
        <section className="return-card return-card--amber">
          <div className="return-card-head">
            <span className="return-mark return-mark--amber">!</span>
            <div className="return-card-title">
              {state.filesChanged} {state.filesChanged === 1 ? 'file' : 'files'} changed after your handoff
            </div>
          </div>
          <div className="return-rows">
            <div className="return-row">
              <div className="return-row-label">What you asked for</div>
              <div className="return-row-value">{update.goal || update.title}</div>
            </div>
            <div className="return-row">
              <div className="return-row-label">What changed</div>
              <div className="return-row-value">
                {state.files.length
                  ? state.files.join(', ')
                  : 'Yourk could not list the files.'}
              </div>
            </div>
            <div className="return-row">
              <div className="return-row-label">Worth a look</div>
              <div className="return-row-value">
                Read the changes before anything is saved — a plain-English review comes next.
              </div>
            </div>
          </div>
          <div className="return-next">
            <div className="return-next-label">Recommended next step</div>
            <div className="return-next-text">
              Read the plain-English review before anything is saved.
            </div>
          </div>
          <Link to={reviewLink} className="pl-btn-primary">Review changes</Link>
        </section>
      )}

      {/* 2. Nothing yet */}
      {state.status === 'none' && (
        <section className="return-card">
          <div className="return-card-title">Nothing has changed yet</div>
          <p className="return-card-body">
            Your project in GitHub looks exactly as it did before the handoff. That usually means
            the AI hasn't saved its work yet — or it made changes somewhere Yourk can't see,
            like on your own computer.
          </p>
          <div className="return-actions">
            <button className="pl-btn-primary" onClick={check}>Check again</button>
            <Link to={`/p/${owner}/${repo}/u/${updateId}/ai`} className="pl-btn">Send the handoff again</Link>
          </div>
        </section>
      )}

      {/* 3. The AI saved it itself */}
      {state.status === 'external' && (
        <section className="return-card return-card--green">
          <div className="return-card-head">
            <span className="return-mark return-mark--green">✓</span>
            <div className="return-card-title">The AI already saved this work to GitHub</div>
          </div>
          <p className="return-card-body">
            There {state.commits === 1 ? 'is' : 'are'} {state.commits} new Save{' '}
            {state.commits === 1 ? 'Point' : 'Points'} that Yourk didn't create. Your work is
            safe — but nobody has read through it in plain English yet, so it's worth a look
            before you build on top of it.
          </p>
          <div className="return-actions">
            <Link to={reviewLink} className="pl-btn-primary">Read what changed</Link>
            <Link to={`/p/${owner}/${repo}/changed`} className="pl-btn">See the Save Points</Link>
          </div>
        </section>
      )}

      {/* 4. GitHub is ahead of the work waiting here */}
      {state.status === 'newer' && (
        <section className="return-card return-card--red">
          <div className="return-card-title">
            GitHub has a newer version than the one on this computer
          </div>
          <p className="return-card-body">
            Get the latest version first. If you edit now, you'd be working from an old copy and
            Yourk would have to ask you to choose between them later.
          </p>
          <div className="return-actions">
            <Link to={`/p/${owner}/${repo}/versions`} className="pl-btn-primary">Get latest version</Link>
            <Link to={reviewLink} className="pl-btn">See what's different first</Link>
          </div>
        </section>
      )}

      {/* 5. Can't check */}
      {state.status === 'offline' && (
        <section className="return-card">
          <div className="return-card-title">Yourk can't check GitHub right now</div>
          <p className="return-card-body">
            This is a connection problem, not a problem with your work. Nothing has been lost,
            and nothing will be saved until you say so.
          </p>
          <div className="return-actions">
            <button className="pl-btn-primary" onClick={check}>Try again</button>
            <Link to={`/p/${owner}/${repo}/u/${updateId}`} className="pl-btn">Back to the update</Link>
          </div>
        </section>
      )}

      {/* No handoff was ever recorded, so there is nothing to compare against. */}
      {state.status === 'nohandoff' && (
        <section className="return-card">
          <div className="return-card-title">Yourk has nothing to compare against</div>
          <p className="return-card-body">
            This update was never marked as sent, so Yourk didn't record where GitHub was at
            the time. Hand it to an AI and mark it as sent — then this screen can tell you
            exactly what changed.
          </p>
          <div className="return-actions">
            <Link to={`/p/${owner}/${repo}/u/${updateId}/ai`} className="pl-btn-primary">Continue in…</Link>
            <Link to={`/p/${owner}/${repo}/u/${updateId}`} className="pl-btn">Back to the update</Link>
          </div>
        </section>
      )}
    </div>
  )
}
