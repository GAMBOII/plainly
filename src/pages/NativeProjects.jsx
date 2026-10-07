import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { nativeProjects, nativeFiles, nativeVersions, importNativeProject } from '../utils/nativeProjectStore'
import { greeting, timeAgo } from '../utils/time'

const EXPLAINER_DISMISSED_KEY = 'yourkly_native_explainer_dismissed'

function projectStats(project) {
  let files = 0
  let versions = []
  try {
    files = nativeFiles(project.id).length
    versions = nativeVersions(project.id)
  } catch { /* storage may be blocked */ }
  return { files, versions }
}

// The freshest project is the one with the most recent activity: a Save Point
// beats the creation date, since people keep working after they create.
function lastActivityAt(project, versions) {
  let latest = project.updatedAt || project.createdAt || 0
  for (const v of versions) {
    if (v.createdAt && v.createdAt > latest) latest = v.createdAt
  }
  return latest
}

function heroNextLine(project) {
  const { files, versions } = projectStats(project)
  if (files === 0) return 'This project is empty. Open it and add your first file.'
  if (versions[0]) return `${files} ${files === 1 ? 'file' : 'files'} · Last Save Point ${timeAgo(versions[0].createdAt)}.`
  return `${files} ${files === 1 ? 'file' : 'files'} · No Save Point yet.`
}

export default function NativeProjects() {
  const projects = nativeProjects()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [importError, setImportError] = useState(null)

  // Import a .yourkly.json project file (exported from Yourkly, or produced
  // by an AI builder that was given the yourkly-project-v1 format).
  function onImportFile(e) {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const project = importNativeProject(JSON.parse(reader.result))
        navigate(`/native/p/${project.id}`)
      } catch {
        setImportError("That file isn't a Yourkly project file. Import a .yourkly.json file exported from Yourkly.")
      }
    }
    reader.onerror = () => setImportError("Couldn't read that file. Try again.")
    reader.readAsText(file)
  }
  const [explainerDismissed, setExplainerDismissed] = useState(() => {
    try {
      return localStorage.getItem(EXPLAINER_DISMISSED_KEY) === 'true'
    } catch {
      return false
    }
  })

  const dismissExplainer = () => {
    try {
      localStorage.setItem(EXPLAINER_DISMISSED_KEY, 'true')
      setExplainerDismissed(true)
    } catch { /* preference just won't persist */ }
  }

  const withStats = projects.map(p => {
    const { versions } = projectStats(p)
    return { project: p, lastActivity: lastActivityAt(p, versions) }
  })
  withStats.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
  const mostRecent = withStats[0]?.project || null

  // Save Points across every project, newest first — the native version of
  // recent activity.
  const events = []
  for (const p of projects) {
    try {
      for (const v of nativeVersions(p.id)) {
        events.push({ projectName: p.name, label: v.label || 'Save Point', at: v.createdAt })
      }
    } catch { /* storage may be blocked */ }
  }
  events.sort((a, b) => new Date(b.at) - new Date(a.at))

  return (
    <div className="screen-padded home-screen">
      {/* 1. Greeting */}
      <div className="home-header">
        <div>
          <h1 className="home-greeting">{greeting()}.</h1>
          <p className="home-subtitle">
            Here's where you left off, what changed, and what to do next.
          </p>
        </div>
        <div className="home-header-actions">
          <button type="button" className="pl-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Import</button>
          <Link to="/native/new" className="pl-btn home-all-projects">New project</Link>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept=".json,.yourkly.json,application/json" hidden onChange={onImportFile} />
      {importError && <p className="error-box">{importError}</p>}

      {/* 2. Dismissible explainer */}
      {!explainerDismissed && (
        <section className="home-explainer">
          <div>
            <p className="home-explainer-title">New here? This is what Yourkly does.</p>
            <p className="home-explainer-body">
              Yourkly is the front door: it remembers where you stopped and keeps a Save Point
              every time you save so you can always go back. These projects live in this browser
              on this device, so there's no login. They won't follow you to another device
              unless you export them.
            </p>
          </div>
          <button className="home-explainer-dismiss" onClick={dismissExplainer}>Got it</button>
        </section>
      )}

      {/* 3. Continue where you left off */}
      <div className="section-label">Continue where you left off</div>
      {mostRecent ? (
        <section className="home-hero-card home-hero-empty">
          <div className="home-hero-context">
            <span className="home-hero-project">{mostRecent.name}</span>
            <span className="home-hero-separator">·</span>
            <span className="home-hero-label">Most recent project</span>
          </div>
          <p className="home-hero-empty-title">{mostRecent.description || 'Pick up where you left off.'}</p>
          <p className="home-hero-empty-next">{heroNextLine(mostRecent)}</p>
          <div className="home-hero-actions">
            <Link to={`/native/p/${mostRecent.id}`} className="pl-btn-primary home-hero-cta">
              Open the project
            </Link>
            <Link to="/native/new" className="pl-btn">New project</Link>
          </div>
        </section>
      ) : (
        <section className="home-hero-card home-hero-empty">
          <p className="home-hero-empty-title">You haven't started a project yet.</p>
          <p className="home-hero-empty-next">Tell Yourkly what you're making. No GitHub, no developer language needed.</p>
          <div className="home-hero-actions">
            <Link to="/native/new" className="pl-btn-primary home-hero-cta">Make your first project</Link>
          </div>
          <p className="home-empty-note">Have a project file from another tool? <button type="button" className="text-link text-button-inline" onClick={() => fileInputRef.current && fileInputRef.current.click()}>Import it</button>.</p>
          <div className="translation-strip">
            <div><strong>Project</strong><span>The whole thing you're building.</span></div>
            <div><strong>Files</strong><span>The pieces that make up your project.</span></div>
            <div><strong>Save Point</strong><span>A version you can come back to later.</span></div>
          </div>
        </section>
      )}

      {/* 4. Recent projects + recent activity */}
      <div className="home-columns">
        <div>
          <div className="home-column-head">
            <div className="section-label section-label--tight">Recent projects</div>
          </div>
          {withStats.length === 0 && (
            <p className="home-empty-note">No projects yet. Start one and it shows up here.</p>
          )}
          <div className="home-project-list">
            {withStats.map(({ project: p, lastActivity }) => {
              const { files, versions } = projectStats(p)
              return (
                <Link key={p.id} to={`/native/p/${p.id}`} className="home-project-card">
                  <span className="home-project-body">
                    <span className="home-project-top">
                      <span className="home-project-name">{p.name}</span>
                    </span>
                    <span className="home-project-desc">
                      {p.description || 'No description yet. You can add one in project settings.'}
                    </span>
                    <span className="home-project-action">
                      {files} {files === 1 ? 'file' : 'files'} · {versions.length} {versions.length === 1 ? 'Save Point' : 'Save Points'}
                    </span>
                    <span className="home-project-url">Kept in this browser · Last touched {timeAgo(lastActivity)}</span>
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
                Nothing yet. Save Points you make show up here.
              </p>
            )}
            {events.slice(0, 5).map((e, i) => (
              <div key={`${e.projectName}-${e.at}-${i}`} className="home-activity-row">
                <span className="home-activity-dot" aria-hidden="true" />
                <span>
                  <span className="home-activity-what">Created a Save Point</span>
                  <span className="home-activity-meta">
                    {e.label} · {e.projectName} · {timeAgo(e.at)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
