/**
 * NewUpdate.jsx — /p/:repo/new-update (max-width 740px)
 *
 * One question, in the user's words. No file picker, no technical step
 * (HANDOFF §7.6).
 *
 * "Likely area involved" never guesses. Unless Yourkly has a real signal it
 * says so plainly and lets the AI find the file.
 */

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { createUpdate } from '../utils/updateMemory'
import { projectName } from '../utils/projectName'

const AREA_UNKNOWN =
  'Yourkly has not confirmed which file controls this. Your AI can find it from the project ' +
  'contents included in the handoff.'

/** A short title for lists, taken from the first line of what they wrote. */
function titleFrom(text) {
  const first = text.trim().split('\n')[0].trim()
  return first.length > 80 ? `${first.slice(0, 77)}…` : first
}

export default function NewUpdate({ auth }) {
  const { owner, repo } = useParams()
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [created, setCreated] = useState(null)

  function handleContinue(e) {
    e.preventDefault()
    const value = text.trim()
    if (!value || !owner) return
    setCreated(createUpdate(owner, repo, titleFrom(value), value))
  }

  return (
    <div className="screen-padded newupdate-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="newupdate-title">What do you want to change?</h1>
      <p className="newupdate-intro">
        Describe the result you want. You do not need to know which file or technical step
        is involved.
      </p>

      <form onSubmit={handleContinue}>
        <textarea
          className="newupdate-input"
          placeholder="Add a clearer welcome message to the homepage and make the main button easier to find."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={Boolean(created)}
          autoFocus
        />
        {!created && (
          <div className="newupdate-actions">
            <button type="submit" className="pl-btn-primary" disabled={!text.trim()}>
              Continue
            </button>
            <button type="button" className="pl-btn" onClick={() => navigate(`/p/${owner}/${repo}`)}>
              Cancel
            </button>
          </div>
        )}
      </form>

      {created && (
        <section className="newupdate-summary">
          <div className="section-label">Your update</div>

          <div className="newupdate-field">What you want</div>
          <div className="newupdate-value">{created.goal}</div>

          <div className="newupdate-field">Likely area involved</div>
          <div className="newupdate-value newupdate-value--muted">{AREA_UNKNOWN}</div>

          <div className="newupdate-field">Suggested next step</div>
          <div className="newupdate-value">
            Hand this to an AI along with your project context, then come back and save the result.
          </div>

          <div className="newupdate-summary-actions">
            <Link to={`/p/${owner}/${repo}/u/${created.id}/ai`} className="pl-btn-primary">
              Continue in…
            </Link>
            <Link to={`/p/${owner}/${repo}/files`} className="pl-btn">Browse project files</Link>
            <Link to={`/p/${owner}/${repo}`} className="pl-btn">Save task for later</Link>
          </div>
        </section>
      )}
    </div>
  )
}
