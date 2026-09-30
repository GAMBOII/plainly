/**
 * Settings.jsx — /p/:repo/settings (max-width 700px)
 *
 * Name, what the project is, who can see it, and delete (HANDOFF §7.17).
 *
 * The name field holds the real repository name, because renaming changes it
 * in GitHub. Delete requires typing that same name first — it is the one
 * action here that cannot be undone.
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRepoInfo, updateRepoSettings, deleteRepo } from '../api/github'
import { projectName } from '../utils/projectName'
import MobileSheet from '../components/MobileSheet'

export default function Settings({ auth }) {
  const { owner, repo } = useParams()
  const navigate = useNavigate()
  const { token, user } = auth

  const [repoData, setRepoData] = useState(null)
  const [name, setName]         = useState(repo)
  const [description, setDesc]  = useState('')
  const [privateProject, setPrivateProject] = useState(true)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)
  const [typedName, setTypedName]     = useState('')
  const [deleting, setDeleting] = useState(false)
  const [visibilityHelpOpen, setVisibilityHelpOpen] = useState(false)

  useEffect(() => {
    if (!token || !owner) return
    getRepoInfo(token, owner, repo)
      .then(r => {
        setRepoData(r)
        setName(r?.name || repo)
        setDesc(r?.description || '')
        setPrivateProject(Boolean(r?.private))
      })
      .catch(e => setError(e?.message || 'Could not load project settings.'))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  async function handleSave(e) {
    e.preventDefault()
    if (!owner) return
    setSaving(true)
    setError(null)
    try {
      const slug = name.trim().replace(/\s+/g, '-')
      const updated = await updateRepoSettings(token, owner, repo, {
        name: slug || repo,
        description: description.trim(),
        private: privateProject,
      })
      setSaved(true)
      if (updated?.name && updated.name !== repo) {
        navigate(`/p/${owner}/${updated.name}/settings`, { replace: true })
      }
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!owner || typedName.trim() !== repo) return
    setDeleting(true)
    try {
      await deleteRepo(token, owner, repo)
      navigate('/projects', { replace: true })
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="screen-padded settings-screen"><p className="state-loading">Loading…</p></div>
  }

  return (
    <div className="screen-padded settings-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="settings-title">Project settings</h1>

      <form className="settings-card" onSubmit={handleSave}>
        <div>
          <label className="settings-label" htmlFor="p-name">Project name</label>
          <div className="settings-hint">
            This renames the repository in GitHub too. Existing links may stop working.
          </div>
          <input
            id="p-name"
            className="settings-input"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="settings-rule" />

        <div>
          <label className="settings-label" htmlFor="p-desc">What this project is</label>
          <div className="settings-hint">
            One sentence. Shows on your dashboard and in every AI handoff.
          </div>
          <input
            id="p-desc"
            className="settings-input"
            value={description}
            onChange={e => setDesc(e.target.value)}
            disabled={saving}
            placeholder="e.g. The plain-English front door to my GitHub projects"
          />
        </div>

        <div className="settings-actions">
          <button type="submit" className="pl-btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="settings-saved">Saved.</span>}
        </div>
      </form>

      <div className="settings-card">
        <div className="settings-label">Who can see this project</div>
        <div className="settings-body">
          {privateProject ? 'Only you and people you invite can see it.' : 'Anyone can see this project on GitHub.'}
        </div>
        <label className="settings-switch-row" htmlFor="project-private">
          <span>
            <strong>Keep this project private</strong>
            <small>Turn this off only when you want the project visible to anyone.</small>
          </span>
          <input id="project-private" type="checkbox" checked={privateProject} onChange={e => setPrivateProject(e.target.checked)} disabled={saving} />
          <span className="settings-switch" aria-hidden="true" />
        </label>
        <p className="settings-hint">Save changes above to apply this setting.</p>
        <button className="pl-btn settings-visibility-help" onClick={() => setVisibilityHelpOpen(true)} type="button">How visibility works</button>
      </div>

      <MobileSheet open={visibilityHelpOpen} onClose={() => setVisibilityHelpOpen(false)} title="Who can see this project">
        <p>Private projects are visible only to you and people you invite. Public projects can be opened by anyone on GitHub.</p>
        <p>Your choice is applied when you save changes. You can return here later to change it again.</p>
      </MobileSheet>

      {error && <p className="error-box">{error}</p>}

      <div className="settings-card settings-card--danger">
        <div className="settings-label settings-label--danger">Delete this project</div>
        <div className="settings-body">
          This deletes the repository and every Save Point in it from GitHub. It cannot be undone,
          and Yourkly will ask you to type the project name first.
        </div>
        <label className="settings-hint" htmlFor="p-confirm">
          Type <strong>{repo}</strong> to confirm.
        </label>
        <input
          id="p-confirm"
          className="settings-input settings-input--danger"
          value={typedName}
          onChange={e => setTypedName(e.target.value)}
          placeholder={repo}
          disabled={deleting}
        />
        <button
          className="pl-btn settings-delete"
          onClick={handleDelete}
          disabled={deleting || typedName.trim() !== repo}
        >
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>
      </div>
    </div>
  )
}
