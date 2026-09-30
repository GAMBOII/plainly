/**
 * Share.jsx — /p/:repo/share (max-width 820px)
 *
 * Who can see it, and what each choice actually means before anything changes
 * (HANDOFF §7.16).
 *
 * "Anyone with the link" exposes every past Save Point, so it gets its own
 * warning and a second confirmation. The invite panel is honest about what it
 * can do: GitHub sends the invitation, and nothing is shared until accepted.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getRepoInfo, updateRepoSettings } from '../api/github'
import { projectName } from '../utils/projectName'

const SETTINGS = {
  me: {
    label: 'Only me',
    blurb: 'Nobody else can open it, find it, or see your files. Private on GitHub.',
    canRead: 'nothing — nobody but you can open this project.',
    cannot: 'find it, open it, or see that it exists.',
    worth: 'if you want feedback from someone, you have to invite them first.',
    note: 'Only you can open this link right now.',
  },
  people: {
    label: 'Just the people I invite',
    blurb: 'You invite someone by GitHub username. They can read every file and every Save Point — and make their own if you let them.',
    canRead: 'every file, every Save Point, and every note you wrote about what changed.',
    cannot: 'invite other people, delete the project, or change who can see it.',
    worth: 'there is no "just this one file" — an invite covers the whole project.',
    note: 'Only you and people you invited can open this link.',
  },
  link: {
    label: 'Anyone with the link',
    blurb: 'The project becomes public. Anyone can read it, but only people you invite can change anything.',
    canRead: 'every file and your entire history, including versions you thought you had replaced.',
    cannot: 'change your files or make Save Points unless you invite them.',
    worth: 'public means public — search engines and AI tools can read it too.',
    note: 'Anyone can open this link.',
  },
}

export default function Share({ auth }) {
  const { owner, repo } = useParams()
  const { token, user } = auth

  const [repoData, setRepoData] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [choice, setChoice]     = useState('me')
  const [applied, setApplied]   = useState('me')
  const [saving, setSaving]     = useState(false)
  const [confirmPublic, setConfirmPublic] = useState(false)
  const [copied, setCopied]     = useState(false)
  const [invite, setInvite]     = useState('')
  const [canEdit, setCanEdit]   = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    getRepoInfo(token, owner, repo)
      .then(r => {
        setRepoData(r)
        const current = r.private ? 'me' : 'link'
        setChoice(current)
        setApplied(current)
      })
      .catch(e => setError(e?.message || 'Could not load this project.'))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const url = `github.com/${owner}/${repo}`
  const setting = SETTINGS[choice]
  const unchanged = choice === applied

  async function apply() {
    if (unchanged) return
    if (choice === 'link' && !confirmPublic) { setConfirmPublic(true); return }
    setSaving(true)
    setError(null)
    try {
      // GitHub has two states, not three: "just the people I invite" is a
      // private project with collaborators.
      const updated = await updateRepoSettings(token, owner, repo, { private: choice !== 'link' })
      setRepoData(updated)
      setApplied(choice)
      setConfirmPublic(false)
    } catch (e) {
      setError(e.message || 'Could not change who can see this project.')
    } finally {
      setSaving(false)
    }
  }

  function copyAddress() {
    navigator.clipboard?.writeText(`https://${url}`).catch(() => {})
    setCopied(true)
  }

  if (loading) {
    return <div className="screen-padded share-screen"><p className="state-loading">Loading…</p></div>
  }

  return (
    <div className="screen-padded share-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="share-title">Who can see it</h1>
      <p className="share-intro">
        Pick a setting and Yourkly tells you exactly what it means — in normal words, before
        anything changes.
      </p>

      <div className="share-address">
        <div>
          <div className="share-address-label">Project address</div>
          <a className="share-address-url" href={`https://${url}`} target="_blank" rel="noreferrer">{url}</a>
          <div className="share-address-note">{SETTINGS[applied].note}</div>
        </div>
        <button className="pl-btn" onClick={copyAddress}>{copied ? 'Copied ✓' : 'Copy address'}</button>
      </div>

      <div className="share-choices">
        {Object.entries(SETTINGS).map(([id, s]) => (
          <button
            key={id}
            className={`share-choice${choice === id ? ' share-choice--on' : ''}`}
            onClick={() => { setChoice(id); setConfirmPublic(false) }}
          >
            <span className={`share-dot${choice === id ? ' share-dot--on' : ''}`} aria-hidden="true" />
            <span>
              <span className="share-choice-name">{s.label}</span>
              <span className="share-choice-body">{s.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      <section className="share-means">
        <div className="share-means-title">What "{setting.label}" actually means</div>
        <div className="share-means-row">
          <span className="share-mark share-mark--ok" aria-hidden="true">✓</span>
          <span>They can <strong>read</strong>: {setting.canRead}</span>
        </div>
        <div className="share-means-row">
          <span className="share-mark share-mark--no" aria-hidden="true">✕</span>
          <span>They <strong>cannot</strong>: {setting.cannot}</span>
        </div>
        <div className="share-means-row">
          <span className="share-mark share-mark--warn" aria-hidden="true">!</span>
          <span>Worth knowing: {setting.worth}</span>
        </div>
      </section>

      {choice === 'link' && (
        <section className="share-warning">
          <div className="share-warning-title">Before you make it public, check for two things</div>
          <p className="share-warning-body">
            Passwords and API keys — often in files like <code>.env</code> — and anything private
            about you or other people. Making a project public also makes{' '}
            <strong>every past Save Point</strong> public, so deleting a password later isn't
            enough. If you're unsure, choose "Just the people I invite" instead.
          </p>
        </section>
      )}

      {choice === 'people' && (
        <section className="share-invite">
          <div className="share-invite-title">Invite someone</div>
          <div className="share-invite-row">
            <input
              className="share-invite-input"
              placeholder="Their GitHub username"
              value={invite}
              onChange={e => setInvite(e.target.value)}
            />
            <a
              className="pl-btn"
              href={`https://github.com/${owner}/${repo}/settings/access`}
              target="_blank"
              rel="noreferrer"
            >
              Send invite
            </a>
          </div>
          <div className="share-invite-chips">
            <button
              className={`ai-tool${!canEdit ? ' ai-tool--on' : ''}`}
              onClick={() => setCanEdit(false)}
            >
              They can read only
            </button>
            <button
              className={`ai-tool${canEdit ? ' ai-tool--on' : ''}`}
              onClick={() => setCanEdit(true)}
            >
              They can also make changes
            </button>
          </div>
          <div className="share-invite-note">
            {canEdit
              ? 'They will be able to make Save Points, which change your files.'
              : 'Safest choice — they can look but not touch.'}
          </div>
          <div className="share-invite-note">
            They'll get an email from GitHub. Nothing is shared until they accept. Yourkly opens
            GitHub's invite page for this — it does not send invitations itself.
          </div>
        </section>
      )}

      {error && <p className="error-box">{error}</p>}

      <div className="share-apply">
        <button className="pl-btn-primary" onClick={apply} disabled={unchanged || saving}>
          {saving
            ? 'Changing…'
            : unchanged
              ? 'This is already your setting'
              : confirmPublic
                ? 'Yes — make it public'
                : `Change to "${setting.label}"`}
        </button>
        <span className="share-apply-note">
          {unchanged
            ? 'Nothing to change.'
            : confirmPublic
              ? 'This makes every past Save Point readable by anyone.'
              : choice === 'link'
                ? 'Yourkly will ask you to confirm once more.'
                : 'You can change this back any time.'}
        </span>
      </div>
    </div>
  )
}
