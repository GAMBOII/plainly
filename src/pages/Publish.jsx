/**
 * Publish.jsx — /p/:owner/:repo/publish (max-width 760px)
 *
 * Put a project on the web so anyone can open it in a browser. GitHub calls
 * this Pages.
 *
 * Help used to say outright that Yourkly cannot publish for you. That sentence
 * is now false, and has been rewritten — a promise in Help that the app can't
 * keep is the same category of problem as inventing a number.
 *
 * The one thing this screen must never do is claim a site is live before
 * GitHub says it is. Building takes a minute or two, and "building" is shown
 * as its own state rather than as success.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPagesSite, publishPagesSite, getRepoInfo, getBranches } from '../api/github'
import { projectName } from '../utils/projectName'

export default function Publish({ auth }) {
  const { owner, repo } = useParams()
  const { token } = auth

  const [site, setSite]         = useState(undefined)  // undefined = not asked yet, null = not published
  const [repoData, setRepoData] = useState(null)
  const [branches, setBranches] = useState([])
  const [branch, setBranch]     = useState('')
  const [folder, setFolder]     = useState('/')
  const [loading, setLoading]   = useState(true)
  const [working, setWorking]   = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    let cancelled = false
    Promise.all([
      getPagesSite(token, owner, repo).catch(() => null),
      getRepoInfo(token, owner, repo).catch(() => null),
      getBranches(token, owner, repo).catch(() => []),
    ]).then(([s, info, b]) => {
      if (cancelled) return
      setSite(s)
      setRepoData(info)
      setBranches(b)
      setBranch(info?.default_branch || b[0]?.name || 'main')
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token, owner, repo])

  async function publish() {
    setWorking(true)
    setError(null)
    try {
      const created = await publishPagesSite(token, owner, repo, branch, folder)
      setSite(created)
    } catch (e) {
      setError(e.message)
    } finally {
      setWorking(false)
    }
  }

  async function recheck() {
    setWorking(true)
    try {
      setSite(await getPagesSite(token, owner, repo))
    } catch { /* leave what we had */ } finally {
      setWorking(false)
    }
  }

  const isPrivate = repoData?.private

  return (
    <div className="screen-padded publish-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="publish-title">Put this project on the web</h1>
      <p className="publish-intro">
        Publishing gives your project a web address anyone can open. Every time you save,
        GitHub rebuilds the published version within a minute or two — so saving is
        publishing, and there is no separate step to remember.
      </p>

      {loading && <p className="state-loading">Checking whether this project is published…</p>}
      {error && <p className="error-box">{error}</p>}

      {/* ── Already published ── */}
      {!loading && site && (
        <section className="publish-live">
          <div className="section-label section-label--tight">This project is published</div>
          {site.html_url ? (
            <a className="publish-url" href={site.html_url} target="_blank" rel="noreferrer">
              {site.html_url}
            </a>
          ) : (
            <p className="publish-note">GitHub hasn't given it a web address yet.</p>
          )}

          <p className="publish-state">
            {site.status === 'built' && 'The published version is up to date.'}
            {site.status === 'building' && "GitHub is building the published version now. It's usually ready in a minute or two."}
            {site.status === 'errored' && 'GitHub tried to build the published version and something went wrong.'}
            {!site.status && "GitHub hasn't said what state the published version is in."}
          </p>

          {site.source && (
            <p className="publish-note">
              Published from the <strong>{projectName(site.source.branch)}</strong> version,
              {site.source.path === '/' ? ' top folder' : ` the ${site.source.path} folder`}.
            </p>
          )}

          <div className="publish-actions">
            <button className="pl-btn" onClick={recheck} disabled={working}>
              {working ? 'Checking…' : 'Check again'}
            </button>
            <a
              className="pl-btn"
              href={`https://github.com/${owner}/${repo}/settings/pages`}
              target="_blank"
              rel="noreferrer"
            >
              Change how it's published
            </a>
          </div>
        </section>
      )}

      {/* ── Not published yet ── */}
      {!loading && site === null && (
        <section className="publish-offer">
          {isPrivate && (
            <div className="publish-warning">
              <strong>This project is private.</strong> Publishing puts its files on the open
              web where anyone with the address can read them. On a free GitHub account,
              publishing a private project isn't allowed at all — GitHub will refuse below
              rather than quietly making it public.
            </div>
          )}

          <div className="publish-field">
            <label className="section-label section-label--tight" htmlFor="pub-branch">
              Which version to publish
            </label>
            <select
              id="pub-branch"
              className="publish-select"
              value={branch}
              onChange={e => setBranch(e.target.value)}
            >
              {branches.map(b => (
                <option key={b.name} value={b.name}>{projectName(b.name)}</option>
              ))}
            </select>
          </div>

          <div className="publish-field">
            <label className="section-label section-label--tight" htmlFor="pub-folder">
              Which folder the site is in
            </label>
            <select
              id="pub-folder"
              className="publish-select"
              value={folder}
              onChange={e => setFolder(e.target.value)}
            >
              <option value="/">The top folder</option>
              <option value="/docs">The docs folder</option>
            </select>
            <p className="publish-note">
              If you're not sure, leave this as the top folder.
            </p>
          </div>

          <button className="pl-btn-primary" onClick={publish} disabled={working || !branch}>
            {working ? 'Asking GitHub…' : 'Publish this project'}
          </button>
          <p className="publish-note">
            Nothing is published until you press that. You can stop publishing at any time
            from GitHub's settings.
          </p>
        </section>
      )}

      {/* ── Couldn't tell ── */}
      {!loading && site === undefined && !error && (
        <p className="publish-note">
          Yourkly couldn't check whether this project is published, so it can't say either
          way.
        </p>
      )}
    </div>
  )
}
