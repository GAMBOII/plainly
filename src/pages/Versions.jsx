/**
 * Versions.jsx — /p/:repo/versions (max-width 820px)
 *
 * Separate versions, explained as safe copies of the whole project
 * (HANDOFF §7.15).
 *
 * "Get latest version" checks whether GitHub has moved on since Yourkly last
 * looked, and says when it checked. It never claims to be up to date without
 * having asked.
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  getRepoInfo, getCurrentHeadSha, getCommits,
  getBranches, compareBranches, createBranch,
} from '../api/github'
import { getMemory, setMemory } from '../utils/projectMemory'
import { timeAgo, formatCommitLabel } from '../utils/time'
import { projectName } from '../utils/projectName'
import { useShowGithubWords } from '../utils/settings'

export default function Versions({ auth }) {
  const { owner, repo } = useParams()
  const { token } = auth
  const [showWords] = useShowGithubWords()

  const [branches, setBranches] = useState([])
  const [repoData, setRepoData] = useState(null)
  const [latest, setLatest]     = useState(null)   // newest Save Point on the main version
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [checked, setChecked]   = useState(null)   // { at, behind }
  const [gaps, setGaps]         = useState({})     // branch → { ahead, behind } | null
  const [newName, setNewName]   = useState('')
  const [making, setMaking]     = useState(false)
  const [made, setMade]         = useState(null)

  useEffect(() => {
    if (!token || !owner) return
    Promise.all([
      getBranches(token, owner, repo),
      getRepoInfo(token, owner, repo).catch(() => null),
      getCommits(token, owner, repo, 1).catch(() => []),
    ])
      .then(([b, info, commits]) => {
        setBranches(b)
        setRepoData(info)
        setLatest(commits[0] || null)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, owner, repo])

  const mainName = repoData?.default_branch || 'main'

  // How far each separate version has moved. One request each, so it's bounded
  // — and a version Yourkly couldn't compare says so rather than showing 0.
  useEffect(() => {
    if (!token || !owner || !mainName || branches.length === 0) return
    let cancelled = false
    const others = branches.filter(b => b.name !== mainName).slice(0, 10)
    Promise.all(others.map(b =>
      compareBranches(token, owner, repo, mainName, b.name).then(r => [b.name, r])
    )).then(pairs => { if (!cancelled) setGaps(Object.fromEntries(pairs)) })
    return () => { cancelled = true }
  }, [token, owner, repo, mainName, branches])

  async function makeVersion(e) {
    e.preventDefault()
    const name = newName.trim().replace(/\s+/g, '-')
    if (!name) return
    setMaking(true)
    setError(null)
    try {
      const sha = await getCurrentHeadSha(token, owner, repo)
      await createBranch(token, owner, repo, name, sha)
      const fresh = await getBranches(token, owner, repo)
      setBranches(fresh)
      setMade(name)
      setNewName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setMaking(false)
    }
  }

  async function getLatest() {
    try {
      const head = await getCurrentHeadSha(token, owner, repo)
      const mem = getMemory(owner, repo)
      const behind = Boolean(mem.lastSeenCommitSha && mem.lastSeenCommitSha !== head)
      setMemory(owner, repo, { lastSeenCommitSha: head })
      setChecked({ at: new Date().toISOString(), behind })
      const commits = await getCommits(token, owner, repo, 1).catch(() => [])
      if (commits[0]) setLatest(commits[0])
    } catch {
      setError("Yourkly couldn't check GitHub just now. That's a connection problem, not a problem with your work.")
    }
  }

  return (
    <div className="screen-padded versions-screen">
      <Link to={`/p/${owner}/${repo}`} className="back-link">← {projectName(repo)}</Link>
      <h1 className="versions-title">Separate versions</h1>
      <p className="versions-intro">
        A separate version is a safe copy of the whole project. You can try something risky in it
        without touching your main version — and bring it over later if you like it.
      </p>

      {loading && <p className="state-loading">Getting the versions from GitHub…</p>}
      {error && <p className="error-box">{error}</p>}

      {!loading && (
        <>
          <section className="versions-main">
            <div className="versions-main-head">
              <span className="versions-main-name">Main version</span>
              <span className="versions-main-pill">This is what you're working in</span>
            </div>
            <div className="versions-main-body">
              The real version of your project.
              {latest
                ? ` Last Save Point: ${formatCommitLabel((latest.commit?.message || '').split('\n')[0])} · ${timeAgo(latest.commit?.author?.date)}.`
                : ' No Save Points yet.'}
            </div>
            <button className="pl-btn" onClick={getLatest}>
              {checked && !checked.behind ? 'You have the latest version' : 'Get latest version'}
            </button>
            <div className="versions-note">
              {checked
                ? checked.behind
                  ? `Checked ${timeAgo(checked.at)} — GitHub had newer work, and Yourkly has caught up.`
                  : `Checked ${timeAgo(checked.at)} — nothing new in GitHub since your last save.`
                : 'Checks GitHub for anything saved since you last worked here.'}
            </div>
          </section>

          {branches.filter(b => b.name !== mainName).map(b => (
            <section key={b.name} className="versions-branch">
              <div>
                <div className="versions-branch-name">{projectName(b.name)}</div>
                <div className="versions-branch-desc">
                  A safe copy of the project, kept separately from your main version.
                </div>
                <div className="versions-branch-meta">
                  {gaps[b.name] === undefined && 'Checking how far this has moved…'}
                  {gaps[b.name] === null && "Yourkly couldn't compare this with your main version."}
                  {gaps[b.name] && (
                    gaps[b.name].ahead === 0 && gaps[b.name].behind === 0
                      ? 'Exactly the same as your main version.'
                      : [
                          gaps[b.name].ahead
                            ? `${gaps[b.name].ahead} Save ${gaps[b.name].ahead === 1 ? 'Point' : 'Points'} your main version doesn't have`
                            : null,
                          gaps[b.name].behind
                            ? `${gaps[b.name].behind} it's missing from your main version`
                            : null,
                        ].filter(Boolean).join(' · ')
                  )}
                </div>
                {showWords && (
                  <div className="versions-branch-meta">In GitHub words: branch {b.name}</div>
                )}
              </div>
              <a
                className="pl-btn"
                href={`https://github.com/${owner}/${repo}/tree/${b.name}`}
                target="_blank"
                rel="noreferrer"
              >
                Work in this version
              </a>
            </section>
          ))}

          <section className="versions-footer">
            <div className="versions-make">
              <div className="versions-footer-title">Want to try something without risk?</div>
              <div className="versions-footer-body">
                Yourkly copies your project as it is right now into a separate version. Your
                main version stays exactly as it is.
              </div>
              {made && (
                <p className="versions-made">
                  Made “{projectName(made)}”. It starts as an exact copy of your main version.
                </p>
              )}
              <form className="versions-make-form" onSubmit={makeVersion}>
                <input
                  type="text"
                  className="versions-make-input"
                  placeholder="What are you trying? e.g. new welcome screen"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  aria-label="Name for the separate version"
                />
                <button className="pl-btn-primary" type="submit" disabled={making || !newName.trim()}>
                  {making ? 'Making it…' : 'Make a separate version'}
                </button>
              </form>
              <p className="versions-note">
                Spaces become dashes, because GitHub doesn't allow them in a version name.
              </p>
            </div>
          </section>
          <p className="versions-note">
            Bringing a separate version back into your main one still happens on GitHub —
            Yourkly opens the right page rather than pretending it can do it here.{' '}
            <a
              href={`https://github.com/${owner}/${repo}/branches`}
              target="_blank"
              rel="noreferrer"
            >
              Open the versions on GitHub
            </a>
          </p>
        </>
      )}
    </div>
  )
}
